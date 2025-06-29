# Claude OAuth Implementation

## Overview

This implementation adds OAuth-based authentication support for Claude Code, allowing Claude Max subscribers to use their existing subscription instead of requiring separate API billing. The system maintains backward compatibility with the existing API key authentication.

## Key Features

### ✅ Dual Authentication Support
- **API Key Authentication**: Traditional approach using `ANTHROPIC_API_KEY`
- **OAuth Authentication**: For Claude Max subscribers using access/refresh tokens
- **Automatic Token Refresh**: Expired OAuth tokens are automatically refreshed
- **User Preferences**: Per-user OAuth configuration with fallback to global settings

### ✅ Security & Token Management
- **Secure Token Storage**: OAuth tokens stored in user preferences or environment variables
- **Automatic Refresh**: Tokens are validated and refreshed before each task execution
- **Error Handling**: Comprehensive error handling for token validation and refresh failures
- **Token Expiration Checks**: Built-in buffer time to prevent usage of nearly-expired tokens

## Implementation Details

### Backend Changes

#### 1. Environment Configuration (`server/.env.example`)
```bash
# Method 1: Anthropic API Key (traditional approach)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Method 2: Claude OAuth (for Claude Max subscribers)
CLAUDE_ACCESS_TOKEN=your_claude_oauth_access_token_here
CLAUDE_REFRESH_TOKEN=your_claude_oauth_refresh_token_here
CLAUDE_EXPIRES_AT=your_claude_token_expiration_timestamp_here
CLAUDE_USE_OAUTH=false
```

#### 2. OAuth Manager (`server/utils/claude_oauth.py`)
- **ClaudeOAuthManager**: Comprehensive token lifecycle management
- **Token Validation**: Checks token expiration with configurable buffer
- **Automatic Refresh**: Handles token refresh using refresh tokens
- **Credentials Generation**: Creates proper `~/.claude/.credentials.json` format
- **Error Recovery**: Robust error handling and logging

#### 3. Task Execution (`server/utils/code_task_v2.py`)
- **Authentication Detection**: Automatically detects OAuth vs API key usage
- **Token Refresh**: Validates and refreshes tokens before container execution
- **User Preference Updates**: Saves refreshed tokens back to user preferences
- **Container Environment**: Properly configures container with OAuth credentials

#### 4. Database Operations (`server/database.py`)
- **User Preferences**: Added `update_user_preferences` method
- **OAuth Token Storage**: Secure storage and retrieval of OAuth credentials

### Frontend Changes

#### 1. Settings Interface (`async-code-web/components/code-agent-settings.tsx`)
- **OAuth Toggle**: Checkbox to enable OAuth authentication
- **Token Input Fields**: JSON editor for OAuth tokens
- **Usage Instructions**: Clear guidance on obtaining OAuth tokens
- **Authentication Priority**: Visual indication of OAuth precedence
- **Validation**: Real-time JSON validation for all configuration fields

## Usage Guide

### For Claude Max Subscribers

#### 1. Obtain OAuth Tokens
**Linux/Ubuntu:**
```bash
cat ~/.claude/.credentials.json
```

**macOS:**
1. Open Keychain Access
2. Search for "claude"
3. Show password to reveal OAuth tokens

#### 2. Configure in Web Interface
1. Navigate to Settings → Code Agent Settings
2. Check "Use Claude OAuth (Claude Max subscribers)"
3. Enter your OAuth tokens in the provided JSON editor:
```json
{
  "access_token": "your_access_token_here",
  "refresh_token": "your_refresh_token_here", 
  "expires_at": 1234567890
}
```
4. Save settings

#### 3. Environment Variables (Alternative)
```bash
export CLAUDE_USE_OAUTH=true
export CLAUDE_ACCESS_TOKEN="your_access_token"
export CLAUDE_REFRESH_TOKEN="your_refresh_token"
export CLAUDE_EXPIRES_AT="1234567890"
```

### For API Key Users

Continue using the existing API key approach:
```bash
export ANTHROPIC_API_KEY="your_api_key_here"
```

## Authentication Priority

The system uses the following priority order:

1. **User OAuth Tokens** (if configured in user preferences and `useOAuth` is enabled)
2. **Global OAuth Tokens** (if `CLAUDE_USE_OAUTH=true` in environment)
3. **API Key Authentication** (fallback for all other cases)

## Container Integration

### OAuth Credentials File
When OAuth is enabled, the system creates `~/.claude/.credentials.json` in the container:
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": 1234567890,
  "token_type": "Bearer"
}
```

### Environment Variables
OAuth-enabled containers receive:
- `CLAUDE_ACCESS_TOKEN`
- `CLAUDE_REFRESH_TOKEN`
- `CLAUDE_EXPIRES_AT`
- `CLAUDE_USE_OAUTH=1`

## Error Handling

### Token Refresh Failures
- **User Tokens**: Task fails with clear error message
- **Environment Tokens**: Task fails with refresh error details
- **Network Issues**: Retry mechanism with exponential backoff

### Invalid Tokens
- **Malformed Tokens**: Validation fails before task execution
- **Expired Tokens**: Automatic refresh attempted
- **Invalid Refresh Token**: Task fails with authentication error

## Monitoring & Logging

### OAuth Operations
- **Token Loading**: Logs source (user preferences vs environment)
- **Token Validation**: Logs expiration status and remaining time
- **Token Refresh**: Logs refresh success/failure with details
- **User Preference Updates**: Logs successful token updates

### Authentication Flow
- **Method Selection**: Logs chosen authentication method
- **Credential Setup**: Logs credential file creation
- **Task Execution**: Logs authentication success/failure

## Security Considerations

### Token Storage
- **User Preferences**: Encrypted storage in Supabase
- **Environment Variables**: Server-side only, not exposed to client
- **Container Isolation**: Tokens only available within task containers

### Token Refresh
- **Secure Refresh**: Uses HTTPS for all OAuth operations
- **Token Rotation**: Supports refresh token rotation
- **Error Logging**: Logs errors without exposing sensitive data

## Backward Compatibility

### Existing Users
- **No Breaking Changes**: Existing API key users unaffected
- **Graceful Fallback**: OAuth failures fall back to API key if available
- **Migration Path**: Users can switch between authentication methods

### Configuration Format
- **Legacy Support**: Maintains support for existing configuration formats
- **Progressive Enhancement**: New OAuth features added without breaking existing setups

## Benefits for Claude Max Subscribers

### Cost Efficiency
- **No Separate Billing**: Use existing Claude Max subscription
- **Familiar Authentication**: Same OAuth flow as Claude web interface
- **Subscription Limits**: Respects existing Claude Max usage limits

### User Experience
- **Seamless Integration**: OAuth tokens automatically refreshed
- **Web-like Experience**: Same authentication as Claude web interface
- **Error Recovery**: Automatic retry and refresh mechanisms

## Future Enhancements

### Planned Features
- **Token Health Dashboard**: Monitor token status and expiration
- **Batch Token Refresh**: Refresh multiple users' tokens efficiently
- **OAuth Provider Integration**: Direct integration with Claude OAuth provider
- **Automated Token Discovery**: Auto-detect tokens from local Claude installation

### Scalability
- **Multi-User Support**: Per-user OAuth token management
- **Token Caching**: Reduce API calls through intelligent caching
- **Load Balancing**: Distribute OAuth requests across multiple endpoints

## Troubleshooting

### Common Issues

#### "OAuth token refresh failed"
- **Check Network**: Ensure server can reach Claude OAuth endpoints
- **Verify Tokens**: Confirm refresh token is still valid
- **Check Logs**: Review detailed error messages in server logs

#### "Invalid OAuth tokens in user preferences"
- **Verify Format**: Ensure JSON is properly formatted
- **Check Required Fields**: Confirm all required token fields are present
- **Test Tokens**: Verify tokens work with Claude web interface

#### "Missing OAuth tokens"
- **Check Configuration**: Verify OAuth toggle is enabled
- **Confirm Token Input**: Ensure tokens are properly entered and saved
- **Review Environment**: Check environment variables if using global configuration

### Debug Mode
Enable detailed OAuth logging:
```bash
export FLASK_DEBUG=True
export ANTHROPIC_DEBUG=True
```

## API Reference

### ClaudeOAuthManager

#### Methods
- `load_tokens_from_env()`: Load from environment variables
- `load_tokens_from_dict(tokens)`: Load from dictionary/user preferences
- `is_token_expired(buffer_seconds=300)`: Check token expiration
- `refresh_access_token()`: Refresh using refresh token
- `ensure_valid_token()`: Validate and refresh if needed
- `get_credentials_json()`: Generate credentials file content

#### Usage Example
```python
from utils.claude_oauth import ClaudeOAuthManager

oauth_manager = ClaudeOAuthManager()
if oauth_manager.load_tokens_from_env():
    success, refreshed_tokens = oauth_manager.ensure_valid_token()
    if success:
        print("Tokens are valid and ready to use")
```

## Testing

### Test OAuth Flow
1. **Configure OAuth**: Set up valid OAuth tokens
2. **Create Task**: Submit a task with OAuth authentication
3. **Monitor Logs**: Verify token validation and refresh
4. **Check Results**: Confirm task execution success

### Test Token Refresh
1. **Set Expired Token**: Use token with past expiration
2. **Submit Task**: Task should trigger automatic refresh
3. **Verify Update**: Check that user preferences are updated
4. **Confirm Execution**: Task should complete successfully

### Test Fallback
1. **Invalid OAuth**: Configure invalid OAuth tokens
2. **Valid API Key**: Ensure API key is available
3. **Submit Task**: Should fall back to API key authentication
4. **Check Logs**: Verify fallback behavior

This implementation provides a robust, secure, and user-friendly OAuth authentication system that enhances the existing Claude Code automation platform while maintaining full backward compatibility.