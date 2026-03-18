<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 0; }
        .main { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); }
        .header { background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%); padding: 40px 30px; text-align: center; color: white; }
        .header-content h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .header-content p { margin: 10px 0 0; font-size: 16px; opacity: 0.9; }
        .body { padding: 40px 30px; }
        .body p { font-size: 16px; line-height: 24px; color: #475569; margin: 0 0 20px; }
        .body-box { background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px; border: 1px dashed #cbd5e1; }
        .body-box p { margin: 0; font-size: 14px; color: #64748b; }
        .body-box .email { font-weight: 600; color: #334155; font-size: 16px; margin-top: 5px; }
        .btn-wrapper { text-align: center; margin: 35px 0; }
        .btn { display: inline-block; background-color: #4361ee; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; cursor: pointer; transition: background-color 0.2s ease-in-out; box-shadow: 0 4px 6px -1px rgba(67, 97, 238, 0.2), 0 2px 4px -2px rgba(67, 97, 238, 0.1); }
        .btn:hover { background-color: #3b82f6; }
        .divider { height: 1px; background-color: #e2e8f0; margin: 30px 0; }
        .footer-text { font-size: 14px; color: #94a3b8; line-height: 22px; margin: 0 0 10px; }
        .footer-link { color: #4361ee; word-break: break-all; font-size: 13px; }
        .footer-area { text-align: center; padding: 30px; background-color: #f8fafc; color: #94a3b8; font-size: 13px; border-top: 1px solid #f1f5f9; }
        .footer-area p { margin: 5px 0; }
        /* Reset hyperlink styling inside button just in case email clients mess it up */
        a.btn { color: #ffffff !important; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="main">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <h1>S-COOL</h1>
                    <p>Password Reset Request</p>
                </div>
            </div>

            <!-- Body -->
            <div class="body">
                <p>Hello,</p>
                <p>We received a request to reset the password associated with this email address. If you made this request, please follow the instructions below.</p>
                
                <div class="body-box">
                    <p>Account Email</p>
                    <div class="email">{{ $email }}</div>
                </div>

                <div class="btn-wrapper">
                    <a href="{{ $url }}" class="btn">Reset My Password</a>
                </div>

                <p>This password reset link will expire in 60 minutes. If you did not request a password reset, no further action is required and your account remains secure.</p>

                <div class="divider"></div>

                <p class="footer-text">
                    If you're having trouble clicking the "Reset My Password" button, copy and paste the URL below into your web browser:
                </p>
                <a href="{{ $url }}" class="footer-link">{{ $url }}</a>
            </div>

            <!-- Footer -->
            <div class="footer-area">
                <p>&copy; {{ date('Y') }} SCC Group. All rights reserved.</p>
                <p>This is an automated message, please do not reply directly to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>
