"use client";

import { useActionState, useState } from "react";
import {
  Building2,
  GraduationCap,
  Loader2,
  MapPin,
  Network,
  Rocket,
  Users,
  Search,
  Check,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  affinityCategories,
  countryUniversityIds,
  findCountries,
  regions,
  targetRoles,
} from "@/lib/data";
import type { GroupMode } from "@/lib/types";
import { createCampaign, type CampaignFormState } from "../actions";

function toggle(set: Set<string>, ids: string[], on: boolean) {
  const next = new Set(set);
  ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
  return next;
}

/** État d'une case parente à partir de ses enfants. */
function selectionState(selected: Set<string>, ids: string[]) {
  const count = ids.filter((id) => selected.has(id)).length;
  return { checked: count > 0 && count === ids.length, indeterminate: count > 0 && count < ids.length };
}

function CheckRow({
  id,
  label,
  hint,
  checked,
  indeterminate,
  onChange,
  className,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60 transition-colors",
        className,
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        indeterminate={indeterminate}
        onCheckedChange={(value) => onChange(value)}
        className="mt-0.5"
      />
      <span className="leading-snug">
        {label}
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

export function CampaignForm() {
  const [state, action, pending] = useActionState<CampaignFormState, FormData>(createCampaign, {
    error: null,
  });

  const [name, setName] = useState("");
  // Support multi-pays : Set de codes pays (ex: 'FR', 'BE', 'CH')
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set(["FR"]));
  const [universities, setUniversities] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState<GroupMode>("cross_filter");
  const [roles, setRoles] = useState<Set<string>>(new Set(targetRoles.map((r) => r.id)));
  const [batchSize, setBatchSize] = useState(150);
  const [uniSearch, setUniSearch] = useState("");

  const matchedCountries = findCountries([...selectedCountries]);
  const allAvailableUniIds = matchedCountries.flatMap((m) => countryUniversityIds(m.country));

  const payload = JSON.stringify({
    name,
    country: [...selectedCountries][0] || "FR",
    countries: [...selectedCountries],
    universities: [...universities],
    roles: [...roles],
    groups: [...groups],
    groupMode,
    batchSize,
  });

  const toggleCountry = (code: string) => {
    const next = new Set(selectedCountries);
    if (next.has(code)) {
      if (next.size > 1) {
        next.delete(code);
      }
    } else {
      next.add(code);
    }
    setSelectedCountries(next);

    // Mettre à jour les universités sélectionnées pour ne garder que celles des pays actifs
    const newMatched = findCountries([...next]);
    const validUniSet = new Set(newMatched.flatMap((m) => countryUniversityIds(m.country)));
    setUniversities((prev) => {
      const filtered = new Set<string>();
      prev.forEach((id) => {
        if (validUniSet.has(id)) filtered.add(id);
      });
      return filtered;
    });
  };

  const countriesSummary = matchedCountries.map((m) => m.country.name).join(", ");

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="payload" value={payload} />

      <div className="grid gap-6">
        {/* 1. Informations de la campagne */}
        <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-foreground">Informations</CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid gap-2">
            <Label htmlFor="name" className="text-xs font-bold text-foreground">
              Nom de la campagne
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Europe Francophone — Directeurs & Finance — Nov. 2026"
              maxLength={120}
              required
              className="rounded-xl text-xs font-medium"
            />
          </CardContent>
        </Card>

        {/* 2. Zone géographique (Sélection MULTI-PAYS) */}
        <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
          <CardHeader className="p-0 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                <MapPin className="size-4 text-orange-500" />
                Zones géographiques (Sélection multiple)
              </CardTitle>
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full">
                {selectedCountries.size} pays sélectionné{selectedCountries.size > 1 ? "s" : ""}
              </span>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Sélectionnez un ou plusieurs territoires simultanément (ex: <strong>Suisse + Belgique + France</strong>). Les requêtes Google X-Ray couvriront chacun de ces domaines LinkedIn.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid gap-5">
            {regions.map((region) => (
              <div key={region.id} className="grid gap-2">
                <p className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  {region.label}
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {region.countries.map((country) => {
                    const active = selectedCountries.has(country.code);
                    const count = countryUniversityIds(country).length;
                    return (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => toggleCountry(country.code)}
                        aria-pressed={active}
                        className={cn(
                          "relative rounded-xl border p-3 text-left transition-all hover:bg-muted/60 flex items-start justify-between",
                          active
                            ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500 text-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <div>
                          <span className="font-bold text-xs text-foreground block">{country.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {count} établissements & CFA
                          </span>
                        </div>
                        <div
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-md border text-[10px] transition-colors mt-0.5",
                            active
                              ? "bg-orange-600 border-orange-600 text-white"
                              : "border-border bg-background",
                          )}
                        >
                          {active && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 3. Universités, Cégeps, IUT, Écoles & Centres de formation (305+ Établissements) */}
        {matchedCountries.length > 0 && (
          <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
            <CardHeader className="p-0 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
                  <GraduationCap className="size-4 text-orange-500" />
                  Universités, Écoles, IUT & Centres de Formation ({countriesSummary})
                </CardTitle>
                <span className="text-xs font-mono font-bold text-muted-foreground">
                  {universities.size} / {allAvailableUniIds.length} sélectionnés
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Comprend universités publiques, grandes écoles, écoles de commerce, ingénieurs, IUT/BUT, BTS et centres de formation professionnelle.
              </CardDescription>

              {/* Barre de recherche d'établissement */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher une école, un IUT, un cégep ou une université..."
                  value={uniSearch}
                  onChange={(e) => setUniSearch(e.target.value)}
                  className="h-8.5 pl-8.5 rounded-xl text-xs font-medium"
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 grid gap-4">
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUniversities(new Set(allAvailableUniIds))}
                  className="h-7 text-xs font-semibold rounded-lg gap-1"
                >
                  <CheckCheck className="size-3.5" />
                  Tout sélectionner ({allAvailableUniIds.length})
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUniversities(new Set())}
                  className="h-7 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground"
                >
                  Tout désélectionner
                </Button>
              </div>

              <Separator />

              <div className="space-y-6">
                {matchedCountries.map(({ country }) => (
                  <div key={country.code} className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-border/80 pb-2">
                      <span className="size-2 rounded-full bg-orange-500" />
                      <h3 className="font-extrabold text-sm text-foreground">
                        {country.name} ({countryUniversityIds(country).length} établissements)
                      </h3>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {country.groups.map((group) => {
                        const filteredUnis = group.universities.filter((u) => {
                          if (!uniSearch.trim()) return true;
                          const s = uniSearch.toLowerCase();
                          return (
                            u.name.toLowerCase().includes(s) ||
                            (u.aliases && u.aliases.some((a) => a.toLowerCase().includes(s)))
                          );
                        });

                        if (filteredUnis.length === 0) return null;

                        const ids = filteredUnis.map((u) => u.id);

                        return (
                          <div key={group.id} className="grid content-start gap-1 rounded-xl border border-border/60 bg-muted/20 p-3">
                            <CheckRow
                              id={`group-${country.code}-${group.id}`}
                              label={group.label}
                              {...selectionState(universities, ids)}
                              onChange={(on) => setUniversities(toggle(universities, ids, on))}
                              className="font-bold text-xs text-foreground pb-1 border-b border-border/40"
                            />
                            <div className="mt-1.5 grid max-h-56 gap-0.5 overflow-y-auto pl-1 pr-1 scrollbar-thin text-xs">
                              {filteredUnis.map((u) => (
                                <CheckRow
                                  key={u.id}
                                  id={`uni-${u.id}`}
                                  label={u.name}
                                  checked={universities.has(u.id)}
                                  onChange={(on) => setUniversities(toggle(universities, [u.id], on))}
                                  className="text-xs py-1"
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Groupes & réseaux d'intérêt */}
        <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Network className="size-4 text-orange-500" />
              Groupes & réseaux d&apos;intérêt africains
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Réseaux professionnels et associations de la diaspora.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid gap-5">
            <RadioGroup
              value={groupMode}
              onValueChange={(value) => setGroupMode(value as GroupMode)}
              className="grid gap-2.5 sm:grid-cols-2"
            >
              {(
                [
                  [
                    "cross_filter",
                    "Filtre croisé",
                    "Établissements ET marqueurs africains : ciblage ultra-qualifié.",
                  ],
                  [
                    "standalone",
                    "Ciblage autonome",
                    "Prospection directe et libre (aucun réseau obligatoire requis).",
                  ],
                ] as const
              ).map(([value, title, hint]) => (
                <label
                  key={value}
                  htmlFor={`mode-${value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 text-xs transition-colors",
                    groupMode === value ? "border-orange-500 bg-orange-500/10 text-foreground" : "border-border bg-card hover:bg-muted/40",
                  )}
                >
                  <RadioGroupItem id={`mode-${value}`} value={value} className="mt-0.5" />
                  <span>
                    <span className="font-bold block text-foreground">{title}</span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed mt-0.5 block">{hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>

            <div className="grid gap-5 md:grid-cols-3">
              {affinityCategories.map((category) => {
                const ids = category.groups.map((g) => g.id);
                return (
                  <div key={category.id} className="grid content-start gap-1 rounded-xl border border-border/60 bg-muted/20 p-3">
                    <CheckRow
                      id={`cat-${category.id}`}
                      label={category.label}
                      {...selectionState(groups, ids)}
                      onChange={(on) => setGroups(toggle(groups, ids, on))}
                      className="font-bold text-xs text-foreground pb-1 border-b border-border/40"
                    />
                    <div className="mt-1.5 grid gap-0.5 pl-1">
                      {category.groups.map((g) => (
                        <CheckRow
                          key={g.id}
                          id={`grp-${g.id}`}
                          label={g.name}
                          hint={g.scope}
                          checked={groups.has(g.id)}
                          onChange={(on) => setGroups(toggle(groups, [g.id], on))}
                          className="text-xs py-1"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 5. Métiers ciblés */}
        <Card className="rounded-2xl border-border bg-card p-6 shadow-xs">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <Building2 className="size-4 text-orange-500" />
              Métiers ciblés
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Postes à fort pouvoir d&apos;investissement et professionnels de la finance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-2 gap-1 sm:grid-cols-4">
            {targetRoles.map((role) => (
              <CheckRow
                key={role.id}
                id={`role-${role.id}`}
                label={role.label}
                checked={roles.has(role.id)}
                onChange={(on) => setRoles(toggle(roles, [role.id], on))}
                className="text-xs"
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Récapitulatif latéral Sticky */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card className="rounded-2xl border-border bg-card p-5 shadow-xs card-hover-lift">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-foreground">Récapitulatif Campagne</CardTitle>
          </CardHeader>
          <CardContent className="p-0 grid gap-4 text-xs">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5">
              <dt className="text-muted-foreground font-medium">Territoires</dt>
              <dd className="text-right font-bold text-foreground truncate max-w-44" title={countriesSummary}>
                {countriesSummary || "—"}
              </dd>
              <dt className="text-muted-foreground font-medium">Établissements</dt>
              <dd className="text-right font-mono font-bold text-foreground tabular-nums">{universities.size}</dd>
              <dt className="text-muted-foreground font-medium">Réseaux ciblés</dt>
              <dd className="text-right font-mono font-bold text-foreground tabular-nums">{groups.size}</dd>
              <dt className="text-muted-foreground font-medium">Mode</dt>
              <dd className="text-right font-bold text-foreground">
                {groupMode === "standalone" ? "Autonome" : "Croisé"}
              </dd>
              <dt className="text-muted-foreground font-medium">Métiers</dt>
              <dd className="text-right font-mono font-bold text-foreground tabular-nums">{roles.size}</dd>
            </dl>
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="batch-size" className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Users className="size-4 text-orange-500" />
                Objectif de profils à extraire
              </Label>
              <Input
                id="batch-size"
                type="number"
                min={1}
                max={5000}
                step={25}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="rounded-xl font-mono text-xs font-bold"
              />
            </div>
            {state.error && (
              <p className="rounded-xl bg-destructive/10 p-3 text-xs font-semibold text-destructive">{state.error}</p>
            )}
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold shadow-md shadow-orange-600/20"
            >
              {pending ? <Loader2 className="animate-spin size-4" /> : <Rocket className="size-4" />}
              Créer la campagne
            </Button>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              La campagne sera enregistrée en brouillon. Vous pourrez lancer l&apos;extraction Google X-Ray gratuite en 1 clic.
            </p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
