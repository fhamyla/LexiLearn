const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
  const { email, adminEmail, adminPassword } = data || {};
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    // Authorization: either caller is authenticated OR provided valid admin credentials stored in Firestore
    let isAuthorized = !!context.auth;
    if (!isAuthorized) {
      if (!adminEmail || !adminPassword) {
        throw new functions.https.HttpsError('unauthenticated', 'Missing admin credentials');
      }
      try {
        const adminDoc = await admin.firestore().doc('admins/main').get();
        const data = adminDoc.exists ? adminDoc.data() : null;
        if (!data || data.email !== adminEmail || data.password !== adminPassword) {
          throw new functions.https.HttpsError('permission-denied', 'Invalid admin credentials');
        }
        isAuthorized = true;
      } catch (e) {
        if (e instanceof functions.https.HttpsError) throw e;
        throw new functions.https.HttpsError('internal', 'Failed to validate admin credentials');
      }
    }

    // Delete Firestore user document if present
    try {
      await admin.firestore().collection('users').doc(email).delete();
    } catch (_err) {
      // Ignore missing doc errors
    }

    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail(email);

    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(userRecord.uid);

    return {
      success: true,
      message: 'User has been completely deleted from Firebase Authentication and Firestore'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user from Firebase Authentication');
  }
}); 