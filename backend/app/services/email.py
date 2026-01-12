def send_verification_email(email: str, otp: str):
    print("================================================")
    print(f"[EMAIL MOCK] To: {email}")
    print(f"[EMAIL MOCK] Subject: Your Verification Code")
    print(f"[EMAIL MOCK] Code: {otp}")
    print("================================================")
    return True
