# Security Policy

## Firebase API Keys in Public Repository

### ⚠️ This is intentional and safe

This repository contains Firebase API keys **by design**. This is a **public Progressive Web App (PWA)** that anyone can use directly from GitHub Pages.

### Why is this secure?

Firebase API keys for web applications are **designed to be public**. According to [Firebase official documentation](https://firebase.google.com/docs/projects/api-keys):

> "Unlike how API keys are typically used, API keys for Firebase services are not used to control access to backend resources. They only identify your Firebase project on the Google servers."

### Security measures implemented:

1. **✅ HTTP Referrer Restrictions**
   - API key is restricted to specific domains in Google Cloud Console
   - Only authorized domains can use the API key
   - Prevents unauthorized use from other websites

2. **✅ Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /comentarios/{comentarioId} {
         allow read: if true;  // Public read
         allow create: if request.auth != null;  // Only authenticated users can write
         allow update, delete: if false;  // No editing/deleting
       }
     }
   }
   ```

3. **✅ Authentication Required for Write Operations**
   - Users must authenticate (Google/Email) to create comments
   - Public users can only read existing comments
   - No anonymous writes allowed

4. **✅ Data Validation**
   - Maximum character limits enforced
   - Rating range validation (1-5 stars)
   - Structured data requirements

5. **✅ Firebase Quotas and Monitoring**
   - Usage alerts configured
   - Rate limiting enabled
   - Abuse prevention measures active

### What attackers CANNOT do:

❌ Access or modify data without authentication  
❌ Use the API key from unauthorized domains  
❌ Delete or update existing comments  
❌ Bypass Firestore security rules  
❌ Incur costs beyond Firebase free tier limits  

### What users CAN do:

✅ View the public PWA from GitHub Pages  
✅ Authenticate with Google or Email  
✅ Create new comments (authenticated only)  
✅ View existing comments (public read)  

## Reporting Security Issues

If you discover a **genuine security vulnerability** (not the public Firebase config), please:

1. **Do NOT** open a public issue
2. Email: [jgmorenotrezza@gmail.com](mailto:jgmorenotrezza@gmail.com)
3. Include detailed steps to reproduce
4. Allow 48 hours for initial response

## Additional Resources

- [Firebase API Keys Documentation](https://firebase.google.com/docs/projects/api-keys)
- [Firestore Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [PWA Security Best Practices](https://web.dev/security/)

---

**TL;DR**: The Firebase API key is public by design. Security is enforced through HTTP referrer restrictions and Firestore security rules. This is standard practice for public web applications using Firebase.
