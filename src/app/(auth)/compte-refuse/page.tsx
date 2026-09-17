export default function CompteRefusePage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Demande non approuvée</h1>
      <p className="text-zinc-600">
        Votre demande de compte n&apos;a pas été retenue. Pour toute question,
        contactez le service client à{" "}
        <a href="mailto:serviceclient@evertech-france.com" className="underline">
          serviceclient@evertech-france.com
        </a>
        .
      </p>
    </main>
  );
}
