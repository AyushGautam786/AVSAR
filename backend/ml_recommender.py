import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import pickle
import warnings
warnings.filterwarnings('ignore')

class MLInternshipRecommender:
    def __init__(self):
        self.tfidf_skills = TfidfVectorizer(stop_words='english', max_features=500)
        self.tfidf_interests = TfidfVectorizer(stop_words='english', max_features=300)
        self.domain_encoder = LabelEncoder()
        self.location_encoder = LabelEncoder()
        self.scaler = StandardScaler()
        self.ml_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.is_trained = False
        
    def preprocess_data(self, students_df, internships_df, interactions_df=None):
        """
        Preprocess data for ML model training
        
        Parameters:
        - students_df: DataFrame with student profiles
        - internships_df: DataFrame with internship details
        - interactions_df: DataFrame with student-internship interactions (optional)
        """
        print("Preprocessing data...")
        
        # Create student-internship pairs
        pairs = []
        
        if interactions_df is not None:
            # Use actual interaction data if available
            for _, interaction in interactions_df.iterrows():
                student_id = interaction['student_id']
                internship_id = interaction['internship_id']
                rating = interaction['rating']  # 1-5 scale or binary (applied/not applied)
                
                student = students_df[students_df['id'] == student_id].iloc[0]
                internship = internships_df[internships_df['id'] == internship_id].iloc[0]
                
                pair = self.create_feature_vector(student, internship)
                pair['target'] = rating
                pairs.append(pair)
        else:
            # Generate synthetic training data based on compatibility rules
            print("Generating synthetic training data...")
            for _, student in students_df.iterrows():
                for _, internship in internships_df.iterrows():
                    pair = self.create_feature_vector(student, internship)
                    # Generate synthetic target based on compatibility
                    pair['target'] = self.generate_synthetic_target(student, internship)
                    pairs.append(pair)
        
        return pd.DataFrame(pairs)
    
    def create_feature_vector(self, student, internship):
        """Create feature vector for student-internship pair"""
        features = {}
        
        # Domain matching features
        student_domains = student.get('preferred_domains', [])
        if isinstance(student_domains, str):
            student_domains = student_domains.split(',')
        
        internship_domain = internship.get('domain', '')
        features['domain_exact_match'] = 1 if internship_domain in student_domains else 0
        features['domain_similarity'] = self.calculate_domain_similarity(student_domains, internship_domain)
        
        # Location matching features
        student_locations = student.get('preferred_locations', [])
        if isinstance(student_locations, str):
            student_locations = student_locations.split(',')
        
        internship_location = internship.get('location', '')
        features['location_exact_match'] = 1 if internship_location in student_locations else 0
        features['is_remote'] = 1 if internship.get('is_remote', False) else 0
        features['location_flexibility'] = len(student_locations)
        
        # Skills matching features
        student_skills = student.get('skills', [])
        if isinstance(student_skills, str):
            student_skills = student_skills.split(',')
        
        required_skills = internship.get('required_skills', [])
        if isinstance(required_skills, str):
            required_skills = required_skills.split(',')
        
        features['skills_overlap'] = len(set(student_skills) & set(required_skills))
        features['skills_coverage'] = features['skills_overlap'] / max(len(required_skills), 1)
        features['student_skill_count'] = len(student_skills)
        features['required_skill_count'] = len(required_skills)
        
        # Interest matching features
        student_interests = student.get('interests', [])
        if isinstance(student_interests, str):
            student_interests = student_interests.split(',')
        
        job_description = internship.get('description', '')
        features['interest_job_similarity'] = self.calculate_text_similarity(
            ' '.join(student_interests), job_description
        )
        
        # Company and role features
        features['company_size'] = internship.get('company_size', 0)  # Small=1, Medium=2, Large=3
        features['stipend'] = internship.get('stipend', 0)
        features['duration_weeks'] = internship.get('duration_weeks', 12)
        
        # Encoded categorical features
        features['domain_encoded'] = internship_domain
        features['location_encoded'] = internship_location
        
        return features
    
    def calculate_domain_similarity(self, student_domains, internship_domain):
        """Calculate semantic similarity between domains"""
        domain_mapping = {
            'web dev': ['frontend', 'backend', 'fullstack', 'web development'],
            'ai/ml': ['artificial intelligence', 'machine learning', 'data science', 'deep learning'],
            'mobile dev': ['android', 'ios', 'react native', 'flutter'],
            'marketing': ['digital marketing', 'content marketing', 'social media marketing'],
            'data science': ['data analysis', 'analytics', 'business intelligence', 'ai/ml'],
            'cybersecurity': ['security', 'penetration testing', 'network security'],
            'cloud': ['aws', 'azure', 'gcp', 'devops'],
            'product management': ['pm', 'product', 'strategy']
        }
        
        max_similarity = 0
        for student_domain in student_domains:
            student_domain_lower = student_domain.lower().strip()
            internship_domain_lower = internship_domain.lower().strip()
            
            # Exact match
            if student_domain_lower == internship_domain_lower:
                return 1.0
            
            # Check semantic similarity
            for key, synonyms in domain_mapping.items():
                if student_domain_lower in synonyms or student_domain_lower == key:
                    if internship_domain_lower in synonyms or internship_domain_lower == key:
                        max_similarity = max(max_similarity, 0.8)
                        break
        
        return max_similarity
    
    def calculate_text_similarity(self, text1, text2):
        """Calculate cosine similarity between two texts"""
        if not text1 or not text2:
            return 0.0
        
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return similarity
        except:
            return 0.0
    
    def generate_synthetic_target(self, student, internship):
        """Generate synthetic target score based on compatibility rules"""
        score = 0
        
        # Domain matching (0-3 points)
        student_domains = student.get('preferred_domains', [])
        if isinstance(student_domains, str):
            student_domains = student_domains.split(',')
        
        internship_domain = internship.get('domain', '')
        domain_similarity = self.calculate_domain_similarity(student_domains, internship_domain)
        score += domain_similarity * 3
        
        # Location matching (0-2 points)
        student_locations = student.get('preferred_locations', [])
        if isinstance(student_locations, str):
            student_locations = student_locations.split(',')
        
        internship_location = internship.get('location', '')
        if internship_location in student_locations or internship.get('is_remote', False):
            score += 2
        elif any(loc.split(',')[0] == internship_location.split(',')[0] for loc in student_locations):
            score += 1
        
        # Skills matching (0-2 points)
        student_skills = student.get('skills', [])
        if isinstance(student_skills, str):
            student_skills = student_skills.split(',')
        
        required_skills = internship.get('required_skills', [])
        if isinstance(required_skills, str):
            required_skills = required_skills.split(',')
        
        if required_skills:
            skills_overlap = len(set(student_skills) & set(required_skills))
            skills_coverage = skills_overlap / len(required_skills)
            score += skills_coverage * 2
        
        # Interest matching (0-1 points)
        student_interests = student.get('interests', [])
        if isinstance(student_interests, str):
            student_interests = student_interests.split(',')
        
        job_description = internship.get('description', '')
        interest_similarity = self.calculate_text_similarity(
            ' '.join(student_interests), job_description
        )
        score += interest_similarity
        
        # Add some noise to make it more realistic
        noise = np.random.normal(0, 0.3)
        score = max(0, min(5, score + noise))  # Keep between 0-5
        
        return score
    
    def prepare_features(self, data_df):
        """Prepare features for ML model"""
        features_df = data_df.copy()
        
        # Encode categorical variables
        categorical_cols = ['domain_encoded', 'location_encoded']
        for col in categorical_cols:
            if col in features_df.columns:
                # Handle unseen categories
                unique_vals = features_df[col].unique()
                if col == 'domain_encoded':
                    if not hasattr(self, 'domain_classes_'):
                        self.domain_encoder.fit(unique_vals)
                        self.domain_classes_ = self.domain_encoder.classes_
                    
                    # Handle unseen categories
                    features_df[col] = features_df[col].apply(
                        lambda x: x if x in self.domain_classes_ else 'other'
                    )
                    if 'other' not in self.domain_classes_:
                        self.domain_classes_ = np.append(self.domain_classes_, 'other')
                        self.domain_encoder.classes_ = self.domain_classes_
                    
                    features_df[col] = self.domain_encoder.transform(features_df[col])
                
                elif col == 'location_encoded':
                    if not hasattr(self, 'location_classes_'):
                        self.location_encoder.fit(unique_vals)
                        self.location_classes_ = self.location_encoder.classes_
                    
                    features_df[col] = features_df[col].apply(
                        lambda x: x if x in self.location_classes_ else 'other'
                    )
                    if 'other' not in self.location_classes_:
                        self.location_classes_ = np.append(self.location_classes_, 'other')
                        self.location_encoder.classes_ = self.location_classes_
                    
                    features_df[col] = self.location_encoder.transform(features_df[col])
        
        # Select feature columns (exclude target)
        feature_cols = [col for col in features_df.columns if col != 'target']
        X = features_df[feature_cols].fillna(0)
        
        return X, feature_cols
    
    def train(self, students_df, internships_df, interactions_df=None):
        """Train the ML recommendation model"""
        print("Starting ML model training...")
        
        # Preprocess data
        training_data = self.preprocess_data(students_df, internships_df, interactions_df)
        
        # Prepare features
        X, self.feature_cols = self.prepare_features(training_data)
        y = training_data['target']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        print("Training Random Forest model...")
        self.ml_model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.ml_model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        
        print(f"Model Performance:")
        print(f"Mean Squared Error: {mse:.4f}")
        print(f"Mean Absolute Error: {mae:.4f}")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_cols,
            'importance': self.ml_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\nTop 10 Feature Importances:")
        print(feature_importance.head(10))
        
        self.is_trained = True
        return {'mse': mse, 'mae': mae, 'feature_importance': feature_importance}
    
    def predict_compatibility(self, student, internships_df):
        """Predict compatibility scores for student-internship pairs"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        predictions = []
        
        for _, internship in internships_df.iterrows():
            # Create feature vector
            features = self.create_feature_vector(student, internship)
            features_df = pd.DataFrame([features])
            
            # Prepare features
            X, _ = self.prepare_features(features_df)
            
            # Make prediction
            X_scaled = self.scaler.transform(X)
            predicted_score = self.ml_model.predict(X_scaled)[0]
            
            # Convert to 0-100 scale
            match_score = min(100, max(0, (predicted_score / 5.0) * 100))
            
            predictions.append({
                'internship_id': internship.get('id'),
                'company_name': internship.get('company_name'),
                'role_title': internship.get('role_title', internship.get('title')),
                'domain': internship.get('domain'),
                'location': internship.get('location'),
                'match_score': round(match_score, 1),
                'predicted_rating': round(predicted_score, 2),
                'duration_weeks': internship.get('duration_weeks'),
                'stipend': internship.get('stipend'),
                'start_date': internship.get('start_date'),
                'is_remote': internship.get('is_remote', False)
            })
        
        return sorted(predictions, key=lambda x: x['match_score'], reverse=True)
    
    def get_recommendations(self, student_profile, internships_df, top_n=10):
        """Get top N recommendations for a student"""
        predictions = self.predict_compatibility(student_profile, internships_df)
        return predictions[:top_n]
    
    def save_model(self, filepath):
        """Save the trained model"""
        if not self.is_trained:
            raise ValueError("No trained model to save")
        
        model_data = {
            'ml_model': self.ml_model,
            'scaler': self.scaler,
            'domain_encoder': self.domain_encoder,
            'location_encoder': self.location_encoder,
            'feature_cols': self.feature_cols,
            'domain_classes_': getattr(self, 'domain_classes_', None),
            'location_classes_': getattr(self, 'location_classes_', None)
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load a trained model"""
        with open(filepath, 'rb') as f:
            model_data = pickle.load(f)
        
        self.ml_model = model_data['ml_model']
        self.scaler = model_data['scaler']
        self.domain_encoder = model_data['domain_encoder']
        self.location_encoder = model_data['location_encoder']
        self.feature_cols = model_data['feature_cols']
        
        if model_data.get('domain_classes_') is not None:
            self.domain_classes_ = model_data['domain_classes_']
        if model_data.get('location_classes_') is not None:
            self.location_classes_ = model_data['location_classes_']
        
        self.is_trained = True
        print(f"Model loaded from {filepath}")

    def batch_predict(self, students_df, internships_df, top_n=10):
        """Get recommendations for multiple students efficiently"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        all_recommendations = {}
        
        for _, student in students_df.iterrows():
            recommendations = self.get_recommendations(
                student.to_dict(), 
                internships_df, 
                top_n=top_n
            )
            all_recommendations[student['id']] = recommendations
        
        return all_recommendations

    def explain_recommendation(self, student, internship):
        """Provide explanation for why an internship was recommended"""
        features = self.create_feature_vector(student, internship)
        
        explanation = {
            'match_reasons': [],
            'feature_scores': features
        }
        
        # Domain matching explanation
        if features['domain_exact_match'] == 1:
            explanation['match_reasons'].append(f"Perfect domain match: {internship.get('domain')}")
        elif features['domain_similarity'] > 0.5:
            explanation['match_reasons'].append(f"Good domain similarity: {internship.get('domain')}")
        
        # Location matching explanation
        if features['location_exact_match'] == 1:
            explanation['match_reasons'].append(f"Preferred location: {internship.get('location')}")
        elif features['is_remote'] == 1:
            explanation['match_reasons'].append("Remote work available")
        
        # Skills matching explanation
        if features['skills_coverage'] > 0.7:
            explanation['match_reasons'].append("Strong skills match with requirements")
        elif features['skills_coverage'] > 0.3:
            explanation['match_reasons'].append("Good skills alignment")
        
        # Interest matching explanation
        if features['interest_job_similarity'] > 0.3:
            explanation['match_reasons'].append("Good alignment with your interests")
        
        return explanation

    def get_model_performance(self):
        """Get current model performance metrics"""
        if not self.is_trained:
            return {"error": "Model not trained yet"}
        
        return {
            "model_type": "Random Forest Regressor",
            "features_count": len(self.feature_cols),
            "is_trained": self.is_trained,
            "feature_names": self.feature_cols
        }

    def update_model_incremental(self, new_interactions_df, students_df, internships_df):
        """Update model with new interaction data (simplified incremental learning)"""
        print("Updating model with new interaction data...")
        
        # For now, retrain the entire model with new data
        # In production, you might want to implement true incremental learning
        return self.train(students_df, internships_df, new_interactions_df)