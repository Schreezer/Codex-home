import os
import json
import time
import logging
import requests
from datetime import datetime
from typing import Dict, Optional, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ClaudeOAuthManager:
    """Manages Claude OAuth token lifecycle including refresh operations"""
    
    # Claude OAuth endpoints (these would need to be updated with actual endpoints)
    TOKEN_REFRESH_URL = "https://api.anthropic.com/v1/oauth/token/refresh"
    TOKEN_VALIDATE_URL = "https://api.anthropic.com/v1/oauth/token/validate"
    
    def __init__(self):
        self.access_token = None
        self.refresh_token = None
        self.expires_at = None
        
    def load_tokens_from_env(self) -> bool:
        """Load OAuth tokens from environment variables"""
        try:
            self.access_token = os.getenv('CLAUDE_ACCESS_TOKEN')
            self.refresh_token = os.getenv('CLAUDE_REFRESH_TOKEN')
            expires_at_str = os.getenv('CLAUDE_EXPIRES_AT')
            
            if not all([self.access_token, self.refresh_token, expires_at_str]):
                logger.warning("❌ Missing required OAuth environment variables")
                return False
                
            try:
                self.expires_at = int(expires_at_str)
            except ValueError:
                logger.error(f"❌ Invalid CLAUDE_EXPIRES_AT format: {expires_at_str}")
                return False
                
            logger.info("✅ Successfully loaded OAuth tokens from environment")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load OAuth tokens from environment: {e}")
            return False
    
    def load_tokens_from_dict(self, tokens: Dict) -> bool:
        """Load OAuth tokens from dictionary (user preferences)"""
        try:
            self.access_token = tokens.get('access_token')
            self.refresh_token = tokens.get('refresh_token')
            self.expires_at = tokens.get('expires_at')
            
            if not all([self.access_token, self.refresh_token, self.expires_at]):
                logger.warning("❌ Missing required OAuth tokens in dictionary")
                return False
                
            # Ensure expires_at is an integer
            if isinstance(self.expires_at, str):
                try:
                    self.expires_at = int(self.expires_at)
                except ValueError:
                    logger.error(f"❌ Invalid expires_at format: {self.expires_at}")
                    return False
                    
            logger.info("✅ Successfully loaded OAuth tokens from dictionary")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load OAuth tokens from dictionary: {e}")
            return False
    
    def is_token_expired(self, buffer_seconds: int = 300) -> bool:
        """Check if access token is expired (with optional buffer)"""
        if not self.expires_at:
            logger.warning("⚠️  No expiration time available, assuming expired")
            return True
            
        current_time = int(time.time())
        expires_with_buffer = self.expires_at - buffer_seconds
        
        is_expired = current_time >= expires_with_buffer
        
        if is_expired:
            expires_dt = datetime.fromtimestamp(self.expires_at)
            logger.warning(f"⏰ Token expired or will expire soon. Expires: {expires_dt}")
        else:
            expires_dt = datetime.fromtimestamp(self.expires_at)
            time_left = expires_with_buffer - current_time
            logger.info(f"✅ Token valid. Expires: {expires_dt} ({time_left}s remaining)")
            
        return is_expired
    
    def refresh_access_token(self) -> Tuple[bool, Optional[Dict]]:
        """
        Refresh the access token using the refresh token
        Returns: (success, new_tokens_dict or error_message)
        """
        if not self.refresh_token:
            logger.error("❌ No refresh token available")
            return False, "No refresh token available"
            
        try:
            logger.info("🔄 Attempting to refresh Claude OAuth access token...")
            
            # Prepare refresh request
            headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'Claude-Code-Automation/1.0'
            }
            
            payload = {
                'grant_type': 'refresh_token',
                'refresh_token': self.refresh_token
            }
            
            # Make refresh request
            response = requests.post(
                self.TOKEN_REFRESH_URL,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                token_data = response.json()
                
                # Extract new tokens
                new_access_token = token_data.get('access_token')
                new_refresh_token = token_data.get('refresh_token', self.refresh_token)  # Some systems don't issue new refresh tokens
                expires_in = token_data.get('expires_in')
                
                if not new_access_token or not expires_in:
                    logger.error("❌ Invalid refresh response - missing required fields")
                    return False, "Invalid refresh response"
                
                # Calculate new expiration timestamp
                new_expires_at = int(time.time()) + int(expires_in)
                
                # Update instance variables
                self.access_token = new_access_token
                self.refresh_token = new_refresh_token
                self.expires_at = new_expires_at
                
                new_tokens = {
                    'access_token': new_access_token,
                    'refresh_token': new_refresh_token,
                    'expires_at': new_expires_at,
                    'token_type': 'Bearer'
                }
                
                expires_dt = datetime.fromtimestamp(new_expires_at)
                logger.info(f"✅ Successfully refreshed Claude OAuth token. New expiration: {expires_dt}")
                
                return True, new_tokens
                
            else:
                error_msg = f"Token refresh failed: HTTP {response.status_code}"
                try:
                    error_details = response.json()
                    error_msg += f" - {error_details}"
                except:
                    error_msg += f" - {response.text}"
                    
                logger.error(f"❌ {error_msg}")
                return False, error_msg
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error during token refresh: {e}"
            logger.error(f"❌ {error_msg}")
            return False, error_msg
            
        except Exception as e:
            error_msg = f"Unexpected error during token refresh: {e}"
            logger.error(f"❌ {error_msg}")
            return False, error_msg
    
    def validate_token(self) -> bool:
        """Validate the current access token with Claude API"""
        if not self.access_token:
            logger.warning("⚠️  No access token to validate")
            return False
            
        try:
            logger.info("🔍 Validating Claude OAuth access token...")
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'User-Agent': 'Claude-Code-Automation/1.0'
            }
            
            response = requests.get(
                self.TOKEN_VALIDATE_URL,
                headers=headers,
                timeout=10
            )
            
            is_valid = response.status_code == 200
            
            if is_valid:
                logger.info("✅ Claude OAuth access token is valid")
            else:
                logger.warning(f"❌ Claude OAuth access token validation failed: HTTP {response.status_code}")
                
            return is_valid
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"⚠️  Network error during token validation: {e}")
            return False
            
        except Exception as e:
            logger.warning(f"⚠️  Unexpected error during token validation: {e}")
            return False
    
    def ensure_valid_token(self) -> Tuple[bool, Optional[Dict]]:
        """
        Ensure we have a valid access token, refreshing if necessary
        Returns: (success, new_tokens_dict_if_refreshed)
        """
        # Check if token is expired
        if not self.is_token_expired():
            logger.info("✅ Current token is still valid")
            return True, None
            
        # Token is expired or will expire soon, attempt refresh
        logger.info("🔄 Token expired or expiring soon, attempting refresh...")
        success, result = self.refresh_access_token()
        
        if success:
            logger.info("✅ Token refresh successful")
            return True, result
        else:
            logger.error(f"❌ Token refresh failed: {result}")
            return False, None
    
    def get_credentials_json(self) -> Optional[str]:
        """Get current credentials in JSON format for ~/.claude/.credentials.json"""
        if not all([self.access_token, self.refresh_token, self.expires_at]):
            logger.warning("⚠️  Incomplete credentials, cannot generate JSON")
            return None
            
        credentials = {
            "access_token": self.access_token,
            "refresh_token": self.refresh_token,
            "expires_at": self.expires_at,
            "token_type": "Bearer"
        }
        
        try:
            return json.dumps(credentials, indent=2)
        except Exception as e:
            logger.error(f"❌ Failed to serialize credentials to JSON: {e}")
            return None


def refresh_claude_oauth_tokens(tokens: Dict) -> Tuple[bool, Optional[Dict]]:
    """
    Convenience function to refresh Claude OAuth tokens
    
    Args:
        tokens: Dictionary containing access_token, refresh_token, expires_at
        
    Returns:
        (success, new_tokens_dict or None)
    """
    oauth_manager = ClaudeOAuthManager()
    
    if not oauth_manager.load_tokens_from_dict(tokens):
        return False, None
        
    return oauth_manager.ensure_valid_token()


def validate_claude_oauth_env() -> bool:
    """
    Validate Claude OAuth environment variables
    
    Returns:
        True if all required variables are present and valid
    """
    oauth_manager = ClaudeOAuthManager()
    
    if not oauth_manager.load_tokens_from_env():
        return False
        
    return not oauth_manager.is_token_expired()