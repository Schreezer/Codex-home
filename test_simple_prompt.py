#!/usr/bin/env python3
"""
Test script for direct execution with simple prompt
"""

import requests
import json
import time
import sys

# Configuration
API_BASE_URL = "https://claudegod.narraite.xyz/api"
USER_ID = "00000000-0000-0000-0000-000000000001"
GITHUB_TOKEN = "ghp_uCjVbSHLxF6f3rNkPNd8tQ3LjPJILg2JczK8"

def test_simple_prompt():
    """Test with a very simple prompt"""
    
    print("🧪 Testing Simple Prompt")
    print("=" * 40)
    
    # Very simple test data
    test_payload = {
        "prompt": "hi",  # Super simple prompt
        "repo_url": "https://github.com/Schreezer/Codex-home.git",
        "branch": "main",
        "github_token": GITHUB_TOKEN,
        "model": "claude"
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-User-ID": USER_ID
    }
    
    # Create task
    print("📝 Creating simple test task...")
    try:
        response = requests.post(
            f"{API_BASE_URL}/start-task",
            json=test_payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to create task: {response.status_code}")
            print(response.text)
            return False
            
        task_data = response.json()
        task_id = task_data["task_id"]
        print(f"✅ Task created: {task_id}")
        
    except Exception as e:
        print(f"❌ Error creating task: {e}")
        return False
    
    # Monitor task
    print(f"⏳ Monitoring task {task_id}...")
    
    max_attempts = 30  # 2.5 minutes max
    attempt = 0
    
    while attempt < max_attempts:
        try:
            response = requests.get(
                f"{API_BASE_URL}/task-status/{task_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                task_status = response.json()
                status = task_status["task"]["status"]
                
                print(f"📊 Status: {status}")
                
                if status == "completed":
                    print("🎉 Task completed!")
                    task_details = task_status["task"]
                    print(f"💾 Commit: {task_details.get('commit_hash', 'N/A')}")
                    return True
                    
                elif status == "failed":
                    print(f"❌ Task failed: {task_details.get('error', 'Unknown')}")
                    return False
                    
            else:
                print(f"⚠️ Status check failed: {response.status_code}")
                
        except Exception as e:
            print(f"⚠️ Error: {e}")
            
        attempt += 1
        time.sleep(5)
    
    print("⏰ Timeout")
    return False

if __name__ == "__main__":
    if test_simple_prompt():
        print("✅ Simple test passed!")
    else:
        print("❌ Simple test failed!")