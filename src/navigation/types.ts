export type RootStackParamList = {
  Login: { verifiedEmail?: string } | undefined;
  Signup: undefined;
  VerifyEmail: { email: string; verificationCode: string };
  ForgotPassword: undefined;
  Home: undefined;
};
