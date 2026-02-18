interface AlertProps {
  children: React.ReactNode;
}

export function ErrorAlert({ children }: AlertProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
    >
      {children}
    </div>
  );
}

export function SuccessAlert({ children }: AlertProps) {
  return (
    <div
      role="status"
      className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
    >
      {children}
    </div>
  );
}
