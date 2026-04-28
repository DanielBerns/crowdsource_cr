import os
from flask import Blueprint, url_for, jsonify, request, redirect, current_app
from authlib.integrations.flask_client import OAuth
from infra.google.handle import handle_google_login
from infra.google.schema import GoogleUserData
from core.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

bp = Blueprint('auth_v1', __name__, url_prefix='/api/v1/auth')

# Initialize OAuth (This should ideally be bound to the app in your main factory)
oauth = OAuth()
google = oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

@bp.route('/google/login')
def google_login():
    """Initiates the Google OAuth 2.0 flow."""
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        current_app.logger.error("google_auth_not_configured")
        return jsonify({"error": "Google OAuth is not configured on this server. Missing CLIENT_ID or SECRET."}), 500

    # Build the absolute URL for the callback
    redirect_uri = url_for('auth_v1.google_authorize', _external=True)
    return google.authorize_redirect(redirect_uri)

@bp.route('/google/authorize')
def google_authorize():
    """Handles the callback from Google, processes the user, and issues a local JWT."""
    try:
        # Exchange the authorization code for an access token
        token = google.authorize_access_token()

        # Extract user information from the ID token
        user_info = token.get('userinfo')

        if not user_info:
            return jsonify({"error": "Failed to retrieve user information from Google."}), 400

        # Construct the explicitly typed dictionary for the domain service
        google_data: GoogleUserData = {
            "google_id": user_info.get("sub"),
            "email": user_info.get("email"),
            "name": user_info.get("name")
        }

        # Delegate to the domain service to handle DB lookup, is_active checks, and JWT generation
        # NOTE: auth_service must be injected or imported properly depending on your DI setup
        result = handle_google_login(google_data)

        if result["error"]:
            # e.g., "Account is deactivated."
            return jsonify({"error": result["error"]}), 403

        # Return the local JWT to the frontend PWA
        # We render a simple HTML page that passes it to localStorage and redirects to the root.
        html_response = f"""
        <!DOCTYPE html>
        <html>
        <head><title>Authenticating...</title></head>
        <body>
            <script>
                localStorage.setItem('auth_token', '{result["token"]}');
                window.location.href = '/';
            </script>
        </body>
        </html>
        """
        return html_response

    except Exception as e:
        import traceback
        current_app.logger.error(f"OAuth authorization failed:\n{traceback.format_exc()}")
        return jsonify({"error": "Authentication failed", "details": str(e)}), 500
