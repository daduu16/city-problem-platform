export type RootStackParamList = {
  Login: { verifiedEmail?: string } | undefined;
  Signup: undefined;
  VerifyEmail: { email: string; verificationCode: string };
  ForgotPassword: undefined;
  ChangePassword: undefined;
  Home: undefined;
};
