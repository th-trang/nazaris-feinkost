export default function DatenschutzPage() {
  return (
    <div className="min-h-screen py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto pt-[50px]">
        <h1 className="text-4xl text-gray-900 mb-10">Datenschutzerklärung</h1>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Datenschutz auf einen Blick</h2>
            <h3 className="font-medium text-gray-800 mb-1">Allgemeine Hinweise</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              2. Allgemeine Hinweise und Pflichtinformationen
            </h2>
            <h3 className="font-medium text-gray-800 mb-1">Datenschutz</h3>
            <p>
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst.
              Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der
              gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>
            <p className="mt-2">
              Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
              Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden
              können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und
              wofür wir sie nutzen.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              3. Verantwortliche Stelle
            </h2>
            <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
            <div className="mt-2">
              <p>Nazari&apos;s Feinkost</p>
              <p>Inhaber: [Ihr Name]</p>
              <p>[Straße und Hausnummer]</p>
              <p>[PLZ] Hamburg</p>
              <p>Telefon: [Telefonnummer]</p>
              <p>E-Mail: [E-Mail-Adresse]</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Datenerfassung auf dieser Website</h2>
            <h3 className="font-medium text-gray-800 mb-1">Bestelldaten</h3>
            <p>
              Bei einer Bestellung über unsere Website erheben wir folgende Daten: Vorname,
              Nachname, E-Mail-Adresse und Telefonnummer. Diese Daten werden ausschließlich zur
              Bearbeitung Ihrer Bestellung und zur Zusendung einer Bestellbestätigung verwendet.
            </p>
            <h3 className="font-medium text-gray-800 mt-4 mb-1">Zahlungsdaten</h3>
            <p>
              Die Zahlungsabwicklung erfolgt über den Dienst Stripe. Ihre Zahlungsdaten
              (z.&nbsp;B. Kreditkartennummer) werden direkt an Stripe übermittelt und nicht auf
              unseren Servern gespeichert. Es gelten die Datenschutzbestimmungen von Stripe
              (stripe.com/privacy).
            </p>
            <h3 className="font-medium text-gray-800 mt-4 mb-1">Firebase</h3>
            <p>
              Diese Website nutzt Firebase von Google LLC zur Datenspeicherung und
              Benutzerauthentifizierung. Weitere Informationen finden Sie in der
              Datenschutzerklärung von Google (policies.google.com/privacy).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Ihre Rechte</h2>
            <p>Sie haben jederzeit das Recht:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten,</li>
              <li>die Berichtigung oder Löschung dieser Daten zu verlangen,</li>
              <li>die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen,</li>
              <li>der Verarbeitung Ihrer personenbezogenen Daten zu widersprechen,</li>
              <li>Datenübertragbarkeit zu verlangen.</li>
            </ul>
            <p className="mt-2">
              Außerdem steht Ihnen das Recht zu, sich bei einer Datenschutz-Aufsichtsbehörde über
              die Verarbeitung Ihrer personenbezogenen Daten durch uns zu beschweren.
            </p>
            <p className="mt-2">
              Bei Fragen zum Datenschutz wenden Sie sich bitte an: [E-Mail-Adresse]
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
