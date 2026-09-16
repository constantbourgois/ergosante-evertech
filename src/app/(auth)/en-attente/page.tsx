export default function EnAttentePage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Compte en attente d&apos;approbation</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Votre adresse e-mail est vérifiée. Un administrateur doit encore
        approuver votre compte avant que vous puissiez accéder au
        configurateur et voir les prix. Vous recevrez un e-mail dès que ce
        sera fait.
      </p>
    </main>
  );
}
