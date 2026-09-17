import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// Gabarit du devis — docs/PLAN.md §8. La colonne « V.A » ne doit jamais y
// apparaître : elle n'est de toute façon jamais importée en base (§10), donc
// structurellement absente des données passées à ce composant.

export interface QuoteDocumentLine {
  reference: string;
  designation: string;
  lengthCm: number;
  widthCm: number;
  quantity: number;
  totalAreaSqm: number;
  lineTotal: number;
  hasEdging: boolean;
  edgingLinearMeters: number | null;
  edgingPrice: number | null;
}

export interface QuoteDocumentProps {
  reference: string;
  createdAt: Date;
  validUntil: Date;
  leadTimeLabel: string;
  customer: { companyName: string | null; email: string; phone: string | null };
  lines: QuoteDocumentLine[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  totalHT: number;
  vatRate: number;
  taxAmount: number;
  totalTTC: number;
  branding: {
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    companyAddress: string;
    legalMentions: string;
    quoteFooter: string | null;
  };
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  muted: { color: "#666666" },
  table: { marginTop: 16, borderTop: "1px solid #ddd" },
  row: { flexDirection: "row", borderBottom: "1px solid #eee", paddingVertical: 6 },
  headerRow: { flexDirection: "row", paddingVertical: 6, fontWeight: 700 },
  colRef: { width: "18%" },
  colDim: { width: "22%" },
  colQty: { width: "10%", textAlign: "right" },
  colArea: { width: "18%", textAlign: "right" },
  colTotal: { width: "22%", textAlign: "right" },
  totals: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 8, color: "#888" },
});

function formatEUR(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR").format(date);
}

export function QuoteDocument(props: QuoteDocumentProps) {
  const { primaryColor, secondaryColor } = props.branding;
  return (
    <Document title={`Devis ${props.reference}`}>
      <Page size="A4" style={styles.page}>
        <View style={{ height: 6, backgroundColor: primaryColor, marginBottom: 20 }} />
        <View style={styles.header}>
          <View>
            {props.branding.logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image, pas une balise HTML img
              <Image src={props.branding.logoUrl} style={{ width: 120, marginBottom: 8 }} />
            ) : null}
            <Text style={[styles.title, { color: primaryColor }]}>
              Devis {props.reference}
            </Text>
            <Text style={styles.muted}>Émis le {formatDate(props.createdAt)}</Text>
            <Text style={styles.muted}>Valable jusqu&apos;au {formatDate(props.validUntil)}</Text>
            <Text style={styles.muted}>Délai de livraison : {props.leadTimeLabel}</Text>
          </View>
          <View>
            <Text>{props.customer.companyName ?? ""}</Text>
            <Text>{props.customer.email}</Text>
            <Text>{props.customer.phone ?? ""}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View
            style={[
              styles.headerRow,
              { backgroundColor: secondaryColor, paddingHorizontal: 6 },
            ]}
          >
            <Text style={styles.colRef}>Référence</Text>
            <Text style={styles.colDim}>Dimensions</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colArea}>Surface</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {props.lines.map((line, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.colRef}>{line.reference}</Text>
              <Text style={styles.colDim}>
                {line.lengthCm} × {line.widthCm} cm
              </Text>
              <Text style={styles.colQty}>{line.quantity}</Text>
              <Text style={styles.colArea}>{line.totalAreaSqm.toFixed(4)} m²</Text>
              <Text style={styles.colTotal}>{formatEUR(line.lineTotal)}</Text>
            </View>
          ))}
          {props.lines
            .filter((l) => l.hasEdging)
            .map((line, index) => (
              <View key={`edge-${index}`} style={styles.row}>
                <Text style={styles.colRef}>CHAN01</Text>
                <Text style={styles.colDim}>
                  Chant — {(line.edgingLinearMeters ?? 0).toFixed(2)} ml
                </Text>
                <Text style={styles.colQty} />
                <Text style={styles.colArea} />
                <Text style={styles.colTotal}>{formatEUR(line.edgingPrice ?? 0)}</Text>
              </View>
            ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Sous-total</Text>
            <Text>{formatEUR(props.subtotal)}</Text>
          </View>
          {props.discountAmount > 0 ? (
            <View style={styles.totalRow}>
              <Text>Remise</Text>
              <Text>− {formatEUR(props.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text>Transport</Text>
            <Text>{formatEUR(props.shippingCost)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Total HT</Text>
            <Text>{formatEUR(props.totalHT)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>TVA ({props.vatRate} %)</Text>
            <Text>{formatEUR(props.taxAmount)}</Text>
          </View>
          <View
            style={[
              styles.totalRow,
              { fontWeight: 700, borderTop: `2px solid ${primaryColor}`, paddingTop: 4 },
            ]}
          >
            <Text>Total TTC</Text>
            <Text>{formatEUR(props.totalTTC)}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>{props.branding.companyAddress}</Text>
          <Text>{props.branding.legalMentions}</Text>
          {props.branding.quoteFooter ? <Text>{props.branding.quoteFooter}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
