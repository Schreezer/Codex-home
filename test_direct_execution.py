#!/usr/bin/env python3
"""
Test script for direct execution mode
Tests the new direct host execution instead of Docker containers
"""

import requests
import json
import time
import sys
import os

# Configuration
API_BASE_URL = "https://claudegod.narraite.xyz/api"
USER_ID = "00000000-0000-0000-0000-000000000001"
GITHUB_TOKEN = "ghp_uCjVbSHLxF6f3rNkPNd8tQ3LjPJILg2JczK8"

def test_direct_execution():
    """Test direct execution with a simple task"""
    
    print("🚀 Testing Direct Execution Mode")
    print("=" * 50)
    
    # Test data
    test_payload = {
        "prompt": "Add a simple comment to the main function explaining what it does",
        "repo_url": "https://github.com/Schreezer/Codex-home.git",
        "branch": "main",
        "github_token": GITHUB_TOKEN,
        "model": "claude"
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-User-ID": USER_ID
    }
    
    # Step 1: Create task
    print("📝 Creating test task...")
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
        print(f"✅ Task created successfully: {task_id}")
        
    except Exception as e:
        print(f"❌ Error creating task: {e}")
        return False
    
    # Step 2: Monitor task execution
    print(f"⏳ Monitoring task {task_id} execution...")
    
    max_attempts = 60  # 5 minutes max
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
                
                print(f"📊 Task {task_id}: {status}")
                
                if status == "completed":
                    print("🎉 Task completed successfully!")
                    
                    # Show results
                    task_details = task_status["task"]
                    print(f"💾 Commit hash: {task_details.get('commit_hash', 'N/A')}")
                    print(f"📁 Changed files: {len(task_details.get('changed_files', []))}")
                    
                    if task_details.get('changed_files'):
                        print("📄 Files modified:")
                        for file in task_details['changed_files']:
                            print(f"  - {file}")
                    
                    return True
                    
                elif status == "failed":
                    print(f"❌ Task failed: {task_details.get('error', 'Unknown error')}")
                    return False
                    
            else:
                print(f"⚠️ Status check failed: {response.status_code}")
                
        except Exception as e:
            print(f"⚠️ Error checking status: {e}")
            
        attempt += 1
        time.sleep(5)
    
    print("⏰ Task monitoring timed out")
    return False

def test_api_health():
    """Test API health endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Health: {data['status']}")
            return True
        else:
            print(f"❌ API Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Health check error: {e}")
        return False

def main():
    """Run all tests"""
    print("🔍 Testing Direct Execution Implementation")
    print("=" * 60)
    
    # Test 1: API Health
    print("\n📋 Test 1: API Health Check")
    if not test_api_health():
        print("❌ API health check failed. Exiting.")
        sys.exit(1)
    
    # Test 2: Direct Execution
    print("\n📋 Test 2: Direct Execution Test")
    if test_direct_execution():
        print("\n🎉 All tests passed! Direct execution is working correctly.")
        sys.exit(0)
    else:
        print("\n❌ Direct execution test failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()