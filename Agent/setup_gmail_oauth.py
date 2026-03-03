"""
One-Time Gmail OAuth2 Setup Script
===================================
Run this ONCE to authorize your Gmail account and get OAuth2 credentials.
It will open a browser for you to sign in to YOUR Google account.

After authorization, it saves a token.json file with your refresh token.
Copy the GMAIL_REFRESH_TOKEN from the output into your .env file.

Prerequisites:
1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable the "Gmail API": 
   - Go to APIs & Services → Library → Search "Gmail API" → Enable
4. Create OAuth2 credentials:
   - Go to APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Application type: "Desktop app"
   - Name: "Portfolio AI"
   - Download the JSON file
5. Rename the downloaded file to "credentials.json" and place it in this Agent/ folder
6. Run this script: python setup_gmail_oauth.py
"""

import os
import json

def main():
    # Check if credentials.json exists
    if not os.path.exists("credentials.json"):
        print("❌ credentials.json not found!")
        print()
        print("Follow these steps:")
        print("1. Go to https://console.cloud.google.com/")
        print("2. Create a project → Enable Gmail API")
        print("3. Go to APIs & Services → Credentials")
        print("4. Create Credentials → OAuth Client ID → Desktop app")
        print("5. Download the JSON file")
        print("6. Rename it to 'credentials.json' and put it in this folder")
        print("7. Run this script again")
        return

    from google_auth_oauthlib.flow import InstalledAppFlow

    # Only need permission to send emails — nothing else
    SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

    flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
    
    # This opens a browser window for you to sign in
    creds = flow.run_local_server(port=0)

    # Save the token for reference
    token_data = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }

    with open("token.json", "w") as f:
        json.dump(token_data, f, indent=2)

    print()
    print("✅ Authorization successful!")
    print()
    print("=" * 60)
    print("Add these to your .env file:")
    print("=" * 60)
    print()
    print(f"GMAIL_CLIENT_ID={creds.client_id}")
    print(f"GMAIL_CLIENT_SECRET={creds.client_secret}")
    print(f"GMAIL_REFRESH_TOKEN={creds.refresh_token}")
    print()
    print("=" * 60)
    print()
    print("✅ token.json saved as backup. You can delete credentials.json now.")
    print("⚠️  NEVER commit token.json or credentials.json to git!")


if __name__ == "__main__":
    main()
