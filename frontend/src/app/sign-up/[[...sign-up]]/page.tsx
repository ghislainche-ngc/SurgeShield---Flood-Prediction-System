import AuthVisualPanel from "@/components/auth/AuthVisualPanel";
import SignUpForm from "@/components/auth/SignUpForm";
import styles from "@/components/auth/auth.module.css";

export default function SignUpPage() {
  return (
    <div className={styles.split}>
      <AuthVisualPanel />
      <main className={styles.panel}>
        <SignUpForm />
      </main>
    </div>
  );
}
