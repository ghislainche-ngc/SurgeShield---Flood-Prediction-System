import AuthVisualPanel from "@/components/auth/AuthVisualPanel";
import SignInForm from "@/components/auth/SignInForm";
import styles from "@/components/auth/auth.module.css";

export default function SignInPage() {
  return (
    <div className={styles.split}>
      <AuthVisualPanel />
      <main className={styles.panel}>
        <SignInForm />
      </main>
    </div>
  );
}
