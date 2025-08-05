const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if the request is from an authenticated admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { email } = data;
  
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    
    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(userRecord.uid);
    
    return {
      success: true,
      message: 'User has been completely deleted from Firebase Authentication and database'
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete user from Firebase Authentication');
  }
}); 