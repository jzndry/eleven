import { Redirect } from 'expo-router';

/**
 * This is the root entry point of your app. 
 * We are doing this because Expo Router needs a starting line to 
 * trigger the navigation logic in your _layout.tsx.
 */
export default function Index() {
  // We return null because the _layout.tsx will intercept this 
  // and redirect the user before they see anything.
  return null;
}