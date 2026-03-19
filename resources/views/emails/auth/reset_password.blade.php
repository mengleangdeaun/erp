<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Reset Your Password — SCC Group</title>
    <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap');

        body, html {
            margin: 0;
            padding: 0;
            background-color: #f0f2f5;
            font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
    </style>
</head>
<body style="margin:0;padding:0;background-color:#eef0f4;">

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef0f4;padding:48px 16px;">
        <tr>
            <td align="center">

                <!-- Card -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.10),0 4px 16px rgba(0,0,0,0.06);">

                    <!-- ── HEADER ── -->
                    <tr>
                        <td style="background-color:#0f1623;padding:0;position:relative;">

                            <!-- Header content -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="padding:44px 48px 40px;">

                                        <!-- Logo row -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td>
                                                    <!-- Logo mark -->
                                                    <table cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
                                                            <td style="padding:0 14px 0 0;vertical-align:middle;">
                                                                <span style="font-family:'Google Sans','Product Sans',sans-serif;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">SCCG</span>
                                                            </td>
                                                            <td style="padding-left:0;vertical-align:middle;border-left:1px solid rgba(255,255,255,0.15);">
                                                                <span style="font-family:'Google Sans','Product Sans',sans-serif;font-size:14px;font-weight:400;color:#94a3b8;letter-spacing:0.3px;padding-left:14px;">SCC Group</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Headline -->
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-top:36px;">
                                                    <p style="margin:0 0 10px;font-family:'Google Sans','Product Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#ee4343ff ;">Security Notice</p>
                                                    <h1 style="margin:0;font-family:'Google Sans','Product Sans',sans-serif;font-size:34px;font-weight:700;color:#f8fafc;line-height:1.2;letter-spacing:-0.5px;">
                                                        Password Reset<br>Request
                                                    </h1>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- ── BODY ── -->
                    <tr>
                        <td style="background-color:#ffffff;padding:48px 48px 40px;">

                            <p style="margin:0 0 24px;font-family:'Google Sans','Product Sans',sans-serif;font-size:16px;line-height:26px;color:#475569;">
                                Hello,
                            </p>
                            <p style="margin:0 0 32px;font-family:'Google Sans','Product Sans',sans-serif;font-size:16px;line-height:26px;color:#475569;">
                                We received a request to reset the password for your account. Use the button below to create a new password.
                            </p>

                            <!-- Account box -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                                <tr>
                                    <td style="background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:20px 24px;">
                                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="padding-right:16px;vertical-align:middle;width:36px;">
                                                    <!-- Icon circle -->
                                                    <table cellpadding="0" cellspacing="0" border="0">
                                                        <tr>
<div style="width:36px;height:36px;background-color:#eff2ff;border-radius:18px;text-align:center;line-height:36px;">
  ✉
</div>                                             </tr>
                                                    </table>
                                                </td>
                                                <td style="vertical-align:middle;">
                                                    <p style="margin:0 0 2px;font-family:'Google Sans','Product Sans',sans-serif;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;">Account</p>
                                                    <p style="margin:0;font-family:'Google Sans','Product Sans',sans-serif;font-size:15px;font-weight:600;color:#1e293b;">{{ $email }}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $url }}" style="display:inline-block;background:linear-gradient(180deg,#FF0000 0%,#B81212 55%);color:#ffffff;font-family:'Google Sans','Product Sans',sans-serif;font-size:15px;font-weight:600;letter-spacing:0.3px;text-decoration:none;padding:15px 40px;border-radius:10px;">
                                            Reset My Password →
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry notice -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                                <tr>
                                    <td style="border-left:3px solid #ee4343ff;padding:12px 16px;background-color:#f8faff;border-radius:0 8px 8px 0;">
                                        <p style="margin:0;font-family:'Google Sans','Product Sans',sans-serif;font-size:13px;line-height:20px;color:#64748b;">
                                            <strong style="color:#1e293b;">Link expires in 60 minutes.</strong> If you didn't request a password reset, you can safely ignore this email — your account remains secure.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Divider -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td style="height:1px;background-color:#f1f5f9;"></td>
                                </tr>
                            </table>

                            <!-- Fallback link -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
                                <tr>
                                    <td>
                                        <p style="margin:0 0 10px;font-family:'Google Sans','Product Sans',sans-serif;font-size:13px;color:#94a3b8;line-height:20px;">
                                            Having trouble with the button? Copy and paste this link into your browser:
                                        </p>
                                        <p style="margin:0;font-family:monospace;font-size:12px;color:#4361ee;word-break:break-all;background-color:#f8fafc;padding:12px 14px;border-radius:8px;border:1px solid #e2e8f0;">
                                            {{ $url }}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- ── FOOTER ── -->
                    <tr>
                        <td style="background-color:#f8fafc;border-top:1px solid #f1f5f9;padding:28px 48px;text-align:center;">
                            <p style="margin:0 0 6px;font-family:'Google Sans','Product Sans',sans-serif;font-size:12px;color:#94a3b8;line-height:18px;">
                                © {{ date('Y') }} SCC Group. All rights reserved.
                            </p>
                            <p style="margin:0;font-family:'Google Sans','Product Sans',sans-serif;font-size:12px;color:#cbd5e1;line-height:18px;">
                                This is an automated message — please do not reply directly to this email.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- /Card -->

            </td>
        </tr>
    </table>

</body>
</html>