"use client";

import { addDays } from "date-fns";
import { ArrowDown, ArrowUp, LibraryBig, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  calculateQuoteLine,
  calculateQuoteTotals,
  evaluateQuoteCompliance,
  formatMoney,
} from "@/domain/quotes";
import type { QuoteLineType, Trade, Unit, VatMode } from "@/domain/quotes/types";
import { saveQuoteEditorAction } from "@/server/actions";
import { ComplianceBadge, MarginBadge } from "./badges";
import { Button, Card, CardHeader, Field, WarningNotice, inputClass } from "./ui";

type EditorClient = {
  id: string;
  type: "INDIVIDUAL" | "PROFESSIONAL";
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  billingAddress: string;
  billingPostalCode: string;
  billingCity: string;
  defaultWorkSiteAddress: string | null;
  defaultWorkSitePostalCode: string | null;
  defaultWorkSiteCity: string | null;
};

type EditorWorkItem = {
  id: string;
  title: string;
  description: string;
  trade: Trade;
  unit: Unit;
  defaultUnitPriceCents: number;
  defaultCostCents: number;
  defaultVatRate: number;
  defaultLaborHours: number | null;
};

type EditorCompany = {
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  siret: string | null;
  siren: string | null;
  vatMode: VatMode;
  insuranceProvider: string | null;
  insurancePolicyNumber: string | null;
  decennaleMention: string | null;
  defaultPaymentTerms: string;
  defaultQuoteValidityDays: number;
  defaultDepositPercent: number | null;
};

type EditorLine = {
  workItemId?: string | null;
  type: QuoteLineType;
  title: string;
  description: string;
  quantity: number;
  unit: Unit;
  unitPriceHtCents: number;
  unitCostCents: number | null;
  vatRate: number;
};

type InitialQuote = {
  id: string;
  clientId: string;
  trade: Trade | null;
  title: string;
  projectDescription: string | null;
  workSiteAddress: string;
  workSitePostalCode: string;
  workSiteCity: string;
  issueDate: string;
  validUntil: string;
  estimatedStartDate: string | null;
  estimatedDurationText: string | null;
  isQuotePaid: boolean;
  quoteFeeCents: number | null;
  paymentTerms: string;
  depositPercent: number | null;
  notesToClient: string | null;
  internalNotes: string | null;
  lines: EditorLine[];
};

const tradeLabels: Record<Trade, string> = {
  PLUMBING: "Plomberie",
  ELECTRICITY: "Électricité",
  PAINTING: "Peinture",
  MASONRY: "Maçonnerie",
  ROOFING: "Couverture",
  CARPENTRY: "Menuiserie",
  TILING: "Carrelage",
  HEATING: "Chauffage",
  INSULATION: "Isolation",
  GENERAL_RENOVATION: "Rénovation générale",
  OTHER: "Autre",
};

const unitLabels: Record<Unit, string> = {
  UNIT: "Unité",
  HOUR: "Heure",
  DAY: "Jour",
  M2: "m²",
  M3: "m³",
  ML: "ml",
  PACKAGE: "Forfait",
};

const lineTypeLabels: Record<QuoteLineType, string> = {
  MATERIAL: "Matériaux",
  LABOR: "Main-d'œuvre",
  TRAVEL: "Déplacement",
  SERVICE: "Prestation",
  DISCOUNT: "Remise",
  SECTION: "Section",
};

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function dateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function eurosFromCents(cents: number | null | undefined) {
  return ((cents ?? 0) / 100).toFixed(2);
}

function centsFromEuros(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function emptyLine(vatMode: VatMode): EditorLine {
  return {
    type: "SERVICE",
    title: "",
    description: "",
    quantity: 1,
    unit: "PACKAGE",
    unitPriceHtCents: 0,
    unitCostCents: 0,
    vatRate: vatMode === "FRANCHISE_BASE" ? 0 : 20,
  };
}

export function QuoteEditor({
  company,
  clients,
  workItems,
  initialQuote,
}: {
  company: EditorCompany;
  clients: EditorClient[];
  workItems: EditorWorkItem[];
  initialQuote?: InitialQuote | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultIssue = todayInput();
  const [error, setError] = useState<string | null>(null);
  const [clientMode, setClientMode] = useState<"existing" | "new">(
    initialQuote || clients.length > 0 ? "existing" : "new",
  );
  const [clientId, setClientId] = useState(initialQuote?.clientId ?? clients[0]?.id ?? "");
  const [newClient, setNewClient] = useState({
    type: "INDIVIDUAL" as "INDIVIDUAL" | "PROFESSIONAL",
    name: "",
    companyName: "",
    email: "",
    phone: "",
    billingAddress: "",
    billingPostalCode: "",
    billingCity: "",
    defaultWorkSiteAddress: "",
    defaultWorkSitePostalCode: "",
    defaultWorkSiteCity: "",
    notes: "",
  });
  const [trade, setTrade] = useState<Trade | "">(initialQuote?.trade ?? "");
  const [title, setTitle] = useState(initialQuote?.title ?? "");
  const [projectDescription, setProjectDescription] = useState(initialQuote?.projectDescription ?? "");
  const [workSiteAddress, setWorkSiteAddress] = useState(initialQuote?.workSiteAddress ?? "");
  const [workSitePostalCode, setWorkSitePostalCode] = useState(initialQuote?.workSitePostalCode ?? "");
  const [workSiteCity, setWorkSiteCity] = useState(initialQuote?.workSiteCity ?? "");
  const [issueDate, setIssueDate] = useState(initialQuote?.issueDate ?? defaultIssue);
  const [validUntil, setValidUntil] = useState(
    initialQuote?.validUntil ?? dateInput(addDays(new Date(), company.defaultQuoteValidityDays)),
  );
  const [estimatedStartDate, setEstimatedStartDate] = useState(initialQuote?.estimatedStartDate ?? "");
  const [estimatedDurationText, setEstimatedDurationText] = useState(initialQuote?.estimatedDurationText ?? "");
  const [isQuotePaid, setIsQuotePaid] = useState(initialQuote?.isQuotePaid ?? false);
  const [quoteFeeCents, setQuoteFeeCents] = useState(initialQuote?.quoteFeeCents ?? 0);
  const [paymentTerms, setPaymentTerms] = useState(initialQuote?.paymentTerms ?? company.defaultPaymentTerms);
  const [depositPercent, setDepositPercent] = useState<number | null>(initialQuote?.depositPercent ?? company.defaultDepositPercent);
  const [notesToClient, setNotesToClient] = useState(initialQuote?.notesToClient ?? "");
  const [internalNotes, setInternalNotes] = useState(initialQuote?.internalNotes ?? "");
  const [selectedItemId, setSelectedItemId] = useState(workItems[0]?.id ?? "");
  const [lines, setLines] = useState<EditorLine[]>(
    initialQuote?.lines?.length ? initialQuote.lines : [emptyLine(company.vatMode)],
  );

  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const complianceClient = useMemo(
    () =>
      clientMode === "existing"
        ? selectedClient
        : {
            name: newClient.name,
            companyName: newClient.companyName,
            billingAddress: newClient.billingAddress,
            billingPostalCode: newClient.billingPostalCode,
            billingCity: newClient.billingCity,
          },
    [clientMode, newClient, selectedClient],
  );

  const calculatedLines = useMemo(
    () => lines.map((line) => calculateQuoteLine({ ...line, vatRate: company.vatMode === "FRANCHISE_BASE" ? 0 : line.vatRate })),
    [company.vatMode, lines],
  );
  const totals = useMemo(() => calculateQuoteTotals(calculatedLines), [calculatedLines]);
  const compliance = useMemo(
    () =>
      evaluateQuoteCompliance(
        {
          title,
          issueDate,
          validUntil,
          workSiteAddress,
          workSitePostalCode,
          workSiteCity,
          paymentTerms,
          estimatedStartDate,
          estimatedDurationText,
          hasAcceptanceArea: true,
        },
        company,
        complianceClient,
        calculatedLines,
      ),
    [
      calculatedLines,
      company,
      complianceClient,
      estimatedDurationText,
      estimatedStartDate,
      issueDate,
      paymentTerms,
      title,
      validUntil,
      workSiteAddress,
      workSiteCity,
      workSitePostalCode,
    ],
  );

  function updateLine(index: number, patch: Partial<EditorLine>) {
    setLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              ...patch,
              vatRate: company.vatMode === "FRANCHISE_BASE" ? 0 : patch.vatRate ?? line.vatRate,
            }
          : line,
      ),
    );
  }

  function addWorkItem() {
    const item = workItems.find((candidate) => candidate.id === selectedItemId);
    if (!item) return;
    setLines((current) => [
      ...current,
      {
        workItemId: item.id,
        type: item.defaultLaborHours ? "SERVICE" : "MATERIAL",
        title: item.title,
        description: item.description,
        quantity: 1,
        unit: item.unit,
        unitPriceHtCents: item.defaultUnitPriceCents,
        unitCostCents: item.defaultCostCents,
        vatRate: company.vatMode === "FRANCHISE_BASE" ? 0 : item.defaultVatRate,
      },
    ]);
  }

  function moveLine(index: number, direction: -1 | 1) {
    setLines((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await saveQuoteEditorAction({
        quoteId: initialQuote?.id,
        clientMode,
        clientId: clientMode === "existing" ? clientId : undefined,
        newClient: clientMode === "new" ? newClient : undefined,
        trade: trade || null,
        title,
        projectDescription,
        workSiteAddress,
        workSitePostalCode,
        workSiteCity,
        issueDate,
        validUntil,
        estimatedStartDate: estimatedStartDate || null,
        estimatedDurationText,
        isQuotePaid,
        quoteFeeCents: isQuotePaid ? quoteFeeCents : null,
        paymentTerms,
        depositPercent,
        notesToClient,
        internalNotes,
        lines,
      });

      if (result.ok) {
        router.push(`/app/quotes/${result.data.quoteId}`);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="grid gap-6 pb-20 xl:grid-cols-[minmax(0,1fr)_380px] xl:pb-0">
      <div className="space-y-6">
        {error ? <WarningNotice title="Enregistrement impossible">{error}</WarningNotice> : null}

        <Card>
          <CardHeader title="Client et chantier" description="Sélectionnez un client existant ou créez-le sans quitter le devis." />
          <div className="grid gap-5 p-5">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mode client">
              <Button type="button" variant={clientMode === "existing" ? "primary" : "secondary"} onClick={() => setClientMode("existing")}>
                Client existant
              </Button>
              <Button type="button" variant={clientMode === "new" ? "primary" : "secondary"} onClick={() => setClientMode("new")}>
                Nouveau client
              </Button>
            </div>

            {clientMode === "existing" ? (
              <Field label="Client">
                <select className={inputClass} value={clientId} onChange={(event) => {
                  const id = event.target.value;
                  setClientId(id);
                  const client = clients.find((candidate) => candidate.id === id);
                  if (client?.defaultWorkSiteAddress) {
                    setWorkSiteAddress(client.defaultWorkSiteAddress);
                    setWorkSitePostalCode(client.defaultWorkSitePostalCode ?? "");
                    setWorkSiteCity(client.defaultWorkSiteCity ?? "");
                  }
                }}>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName || client.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Type">
                  <select className={inputClass} value={newClient.type} onChange={(event) => setNewClient({ ...newClient, type: event.target.value as "INDIVIDUAL" | "PROFESSIONAL" })}>
                    <option value="INDIVIDUAL">Particulier</option>
                    <option value="PROFESSIONAL">Professionnel</option>
                  </select>
                </Field>
                <Field label="Nom client">
                  <input className={inputClass} value={newClient.name} onChange={(event) => setNewClient({ ...newClient, name: event.target.value })} />
                </Field>
                <Field label="Société">
                  <input className={inputClass} value={newClient.companyName} onChange={(event) => setNewClient({ ...newClient, companyName: event.target.value })} />
                </Field>
                <Field label="Email">
                  <input className={inputClass} type="email" value={newClient.email} onChange={(event) => setNewClient({ ...newClient, email: event.target.value })} />
                </Field>
                <Field label="Téléphone">
                  <input className={inputClass} value={newClient.phone} onChange={(event) => setNewClient({ ...newClient, phone: event.target.value })} />
                </Field>
                <Field label="Adresse facturation">
                  <input className={inputClass} value={newClient.billingAddress} onChange={(event) => setNewClient({ ...newClient, billingAddress: event.target.value })} />
                </Field>
                <Field label="Code postal">
                  <input className={inputClass} value={newClient.billingPostalCode} onChange={(event) => setNewClient({ ...newClient, billingPostalCode: event.target.value })} />
                </Field>
                <Field label="Ville">
                  <input className={inputClass} value={newClient.billingCity} onChange={(event) => setNewClient({ ...newClient, billingCity: event.target.value })} />
                </Field>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Adresse chantier">
                <input className={inputClass} value={workSiteAddress} onChange={(event) => setWorkSiteAddress(event.target.value)} />
              </Field>
              <Field label="Code postal chantier">
                <input className={inputClass} value={workSitePostalCode} onChange={(event) => setWorkSitePostalCode(event.target.value)} />
              </Field>
              <Field label="Ville chantier">
                <input className={inputClass} value={workSiteCity} onChange={(event) => setWorkSiteCity(event.target.value)} />
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Informations du devis" description="Objet, validité, paiement et planning prévisionnel." />
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <Field label="Corps de métier">
              <select className={inputClass} value={trade} onChange={(event) => setTrade(event.target.value as Trade | "")}>
                <option value="">Non précisé</option>
                {Object.entries(tradeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Objet du devis">
              <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label="Description projet">
              <textarea className={inputClass} rows={4} value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} />
            </Field>
            <div className="grid gap-4">
              <Field label="Date d'émission">
                <input className={inputClass} type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
              </Field>
              <Field label="Date de validité">
                <input className={inputClass} type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
              </Field>
            </div>
            <Field label="Début estimé">
              <input className={inputClass} type="date" value={estimatedStartDate} onChange={(event) => setEstimatedStartDate(event.target.value)} />
            </Field>
            <Field label="Durée estimée">
              <input className={inputClass} value={estimatedDurationText} onChange={(event) => setEstimatedDurationText(event.target.value)} placeholder="Ex. 5 jours ouvrés" />
            </Field>
            <Field label="Conditions de paiement">
              <textarea className={inputClass} rows={3} value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} />
            </Field>
            <div className="grid gap-4">
              <Field label="Acompte (%)">
                <input className={inputClass} type="number" min="0" max="100" value={depositPercent ?? ""} onChange={(event) => setDepositPercent(event.target.value === "" ? null : Number(event.target.value))} />
              </Field>
              <label className="flex items-center gap-3 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium">
                <input type="checkbox" checked={isQuotePaid} onChange={(event) => setIsQuotePaid(event.target.checked)} />
                Devis payant
              </label>
              {isQuotePaid ? (
                <Field label="Frais de devis (€)">
                  <input className={inputClass} value={eurosFromCents(quoteFeeCents)} onChange={(event) => setQuoteFeeCents(centsFromEuros(event.target.value))} />
                </Field>
              ) : null}
            </div>
            <Field label="Notes client">
              <textarea className={inputClass} rows={3} value={notesToClient} onChange={(event) => setNotesToClient(event.target.value)} />
            </Field>
            <Field label="Notes internes">
              <textarea className={inputClass} rows={3} value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Lignes de devis"
            description="Ajoutez des prestations manuelles ou réutilisez votre bibliothèque d'ouvrages."
            action={
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => setLines((current) => [...current, emptyLine(company.vatMode)])}>
                  <Plus aria-hidden className="h-4 w-4" />
                  Ligne
                </Button>
              </div>
            }
          />
          <div className="border-b border-border p-5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <select className={inputClass} value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>
                {workItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {tradeLabels[item.trade]} - {item.title}
                  </option>
                ))}
              </select>
              <Button type="button" variant="secondary" onClick={addWorkItem} disabled={workItems.length === 0}>
                <LibraryBig aria-hidden className="h-4 w-4" />
                Ajouter depuis la bibliothèque
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-3 py-3">Ordre</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Désignation</th>
                  <th className="px-3 py-3">Qté</th>
                  <th className="px-3 py-3">Unité</th>
                  <th className="px-3 py-3">PU HT</th>
                  <th className="px-3 py-3">Coût HT</th>
                  <th className="px-3 py-3">TVA</th>
                  <th className="px-3 py-3 text-right">Total HT</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const calculated = calculatedLines[index];
                  return (
                    <tr key={`${index}-${line.workItemId ?? "manual"}`} className="border-t border-border bg-card align-top">
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <Button type="button" size="sm" variant="ghost" aria-label="Monter la ligne" onClick={() => moveLine(index, -1)}>
                            <ArrowUp aria-hidden className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="sm" variant="ghost" aria-label="Descendre la ligne" onClick={() => moveLine(index, 1)}>
                            <ArrowDown aria-hidden className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <select className={inputClass} value={line.type} onChange={(event) => updateLine(index, { type: event.target.value as QuoteLineType })}>
                          {Object.entries(lineTypeLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="min-w-72 px-3 py-3">
                        <input className={inputClass} value={line.title} onChange={(event) => updateLine(index, { title: event.target.value })} placeholder="Désignation" />
                        <textarea className={`${inputClass} mt-2`} rows={2} value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} placeholder="Description détaillée" />
                      </td>
                      <td className="px-3 py-3">
                        <input className={`${inputClass} w-24`} type="number" min="0" step="0.01" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} />
                      </td>
                      <td className="px-3 py-3">
                        <select className={inputClass} value={line.unit} onChange={(event) => updateLine(index, { unit: event.target.value as Unit })}>
                          {Object.entries(unitLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <input className={`${inputClass} w-28`} value={eurosFromCents(line.unitPriceHtCents)} onChange={(event) => updateLine(index, { unitPriceHtCents: centsFromEuros(event.target.value) })} />
                      </td>
                      <td className="px-3 py-3">
                        <input className={`${inputClass} w-28`} value={eurosFromCents(line.unitCostCents)} onChange={(event) => updateLine(index, { unitCostCents: centsFromEuros(event.target.value) })} />
                      </td>
                      <td className="px-3 py-3">
                        <select className={inputClass} value={company.vatMode === "FRANCHISE_BASE" ? 0 : line.vatRate} disabled={company.vatMode === "FRANCHISE_BASE"} onChange={(event) => updateLine(index, { vatRate: Number(event.target.value) })}>
                          {[0, 5.5, 10, 20].map((rate) => (
                            <option key={rate} value={rate}>
                              {rate} %
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">{formatMoney(calculated.totalHtCents)}</td>
                      <td className="px-3 py-3">
                        <Button type="button" size="sm" variant="ghost" aria-label="Supprimer la ligne" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}>
                          <Trash2 aria-hidden className="h-4 w-4 text-danger" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 px-4 py-3 backdrop-blur-sm xl:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted">Total TTC</p>
            <p className="text-base font-bold tabular-nums">
              {formatMoney(company.vatMode === "FRANCHISE_BASE" ? totals.subtotalHtCents : totals.totalTtcCents)}
            </p>
          </div>
          <Button type="button" onClick={submit} disabled={isPending} className="shrink-0">
            <Save aria-hidden className="h-4 w-4" />
            {isPending ? "Enregistrement…" : initialQuote ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">Synthèse en direct</p>
              <h2 className="mt-1 text-xl font-bold">Totaux et rentabilité</h2>
            </div>
            <ComplianceBadge status={compliance.status} />
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt>Total HT</dt>
              <dd className="font-semibold">{formatMoney(totals.subtotalHtCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>TVA</dt>
              <dd className="font-semibold">{formatMoney(company.vatMode === "FRANCHISE_BASE" ? 0 : totals.totalVatCents)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-3 text-base">
              <dt>Total TTC</dt>
              <dd className="font-bold">{formatMoney(company.vatMode === "FRANCHISE_BASE" ? totals.subtotalHtCents : totals.totalTtcCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Coûts estimés</dt>
              <dd className="font-semibold">{formatMoney(totals.totalCostCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Marge brute</dt>
              <dd className="font-semibold">{formatMoney(totals.grossMarginCents)}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <MarginBadge marginRate={totals.grossMarginRate} />
          </div>
          <Button type="button" className="mt-5 w-full" onClick={submit} disabled={isPending}>
            <Save aria-hidden className="h-4 w-4" />
            {isPending ? "Enregistrement..." : initialQuote ? "Mettre à jour le devis" : "Enregistrer le devis"}
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold">Points de conformité à vérifier</h2>
          <div className="mt-3 space-y-3 text-sm">
            {compliance.missingFields.length === 0 && compliance.warnings.length === 0 ? (
              <p className="rounded-md bg-green-50 p-3 text-green-800">Devis prêt à envoyer.</p>
            ) : null}
            {compliance.missingFields.length > 0 ? (
              <div>
                <p className="font-semibold text-danger">Mentions manquantes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  {compliance.missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {compliance.warnings.length > 0 ? (
              <div>
                <p className="font-semibold text-warning">Alertes</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  {compliance.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold">Aperçu avant envoi</h2>
          <div className="mt-3 rounded-md border border-border bg-white p-4 text-sm">
            <p className="font-bold text-primary">{title || "Objet du devis"}</p>
            <p className="mt-1 text-muted">{selectedClient?.companyName || selectedClient?.name || newClient.companyName || newClient.name || "Client à renseigner"}</p>
            <div className="mt-4 space-y-2">
              {calculatedLines.slice(0, 5).map((line, index) => (
                <div key={`${line.title}-${index}`} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                  <span>{line.title || "Ligne à compléter"}</span>
                  <strong>{formatMoney(line.totalHtCents)}</strong>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-base">
              <span>Total TTC</span>
              <strong>{formatMoney(company.vatMode === "FRANCHISE_BASE" ? totals.subtotalHtCents : totals.totalTtcCents)}</strong>
            </div>
          </div>
        </Card>
      </aside>
    </div>
  );
}
