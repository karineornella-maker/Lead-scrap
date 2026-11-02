"use client";

import { useActionState, useState } from "react";
import { Building2, GraduationCap, Loader2, MapPin, Network, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { affinityCategories, countryUniversityIds, findCountry, regions, targetRoles } from "@/lib/data";
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
      className={cn("flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60", className)}
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
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [universities, setUniversities] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState<GroupMode>("cross_filter");
  const [roles, setRoles] = useState<Set<string>>(new Set(targetRoles.map((r) => r.id)));
  const [batchSize, setBatchSize] = useState(100);

  const match = countryCode ? findCountry(countryCode) : null;
  const allIds = match ? countryUniversityIds(match.country) : [];

  const payload = JSON.stringify({
    name,
    country: countryCode,
    universities: [...universities],
    roles: [...roles],
    groups: [...groups],
    groupMode,
    batchSize,
  });

  const selectCountry = (code: string) => {
    if (code === countryCode) return;
    setCountryCode(code);
    setUniversities(new Set()); // les universités appartiennent au pays précédent
  };

  return (
    <form action={action} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="payload" value={payload} />

      <div className="grid gap-6">
        {/* 1. Informations */}
        <Card>
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Label htmlFor="name">Nom de la campagne</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Québec — Finance & Audit — Nov. 2026"
              maxLength={120}
              required
            />
          </CardContent>
        </Card>

        {/* 2. Région > Pays > Universités */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-4 text-muted-foreground" />
              Zone géographique
            </CardTitle>
            <CardDescription>Un pays par campagne : les requêtes X-Ray ciblent sa localisation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {regions.map((region) => (
              <div key={region.id} className="grid gap-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{region.label}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {region.countries.map((country) => {
                    const active = country.code === countryCode;
                    const count = countryUniversityIds(country).length;
                    return (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => selectCountry(country.code)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                          active && "border-primary bg-primary/5 ring-1 ring-primary",
                        )}
                      >
                        <span className="font-medium">{country.name}</span>
                        <span className="block text-xs text-muted-foreground">{count} établissements</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {match && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-4 text-muted-foreground" />
                Universités — {match.country.name}
              </CardTitle>
              <CardDescription>
                {universities.size} / {allIds.length} sélectionnées
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <CheckRow
                id="all-universities"
                label={match.country.allLabel ?? `Toutes les universités — ${match.country.name}`}
                {...selectionState(universities, allIds)}
                onChange={(on) => setUniversities(toggle(universities, allIds, on))}
                className="font-medium"
              />
              <Separator />
              <div className="grid gap-5 md:grid-cols-2">
                {match.country.groups.map((group) => {
                  const ids = group.universities.map((u) => u.id);
                  return (
                    <div key={group.id} className="grid content-start gap-0.5">
                      <CheckRow
                        id={`group-${group.id}`}
                        label={group.label}
                        {...selectionState(universities, ids)}
                        onChange={(on) => setUniversities(toggle(universities, ids, on))}
                        className="font-medium"
                      />
                      <div className="ml-4 grid gap-0.5 border-l pl-2">
                        {group.universities.map((u) => (
                          <CheckRow
                            key={u.id}
                            id={`uni-${u.id}`}
                            label={u.name}
                            checked={universities.has(u.id)}
                            onChange={(on) => setUniversities(toggle(universities, [u.id], on))}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. Groupes & réseaux (CLAUDE.md §4) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="size-4 text-muted-foreground" />
              Groupes & réseaux d&apos;intérêt
            </CardTitle>
            <CardDescription>Réseaux professionnels et associations liés aux marchés africains.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <RadioGroup
              value={groupMode}
              onValueChange={(value) => setGroupMode(value as GroupMode)}
              className="grid gap-2 sm:grid-cols-2"
            >
              {(
                [
                  ["cross_filter", "Filtre croisé", "Universités ET groupes : validation renforcée."],
                  ["standalone", "Ciblage autonome", "Prospection directe et libre (aucun groupe ni réseau requis)."],
                ] as const
              ).map(([value, title, hint]) => (
                <label
                  key={value}
                  htmlFor={`mode-${value}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm",
                    groupMode === value && "border-primary bg-primary/5",
                  )}
                >
                  <RadioGroupItem id={`mode-${value}`} value={value} className="mt-0.5" />
                  <span>
                    <span className="font-medium">{title}</span>
                    <span className="block text-xs text-muted-foreground">{hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>

            <div className="grid gap-5 md:grid-cols-3">
              {affinityCategories.map((category) => {
                const ids = category.groups.map((g) => g.id);
                return (
                  <div key={category.id} className="grid content-start gap-0.5">
                    <CheckRow
                      id={`cat-${category.id}`}
                      label={category.label}
                      {...selectionState(groups, ids)}
                      onChange={(on) => setGroups(toggle(groups, ids, on))}
                      className="font-medium"
                    />
                    <div className="ml-4 grid gap-0.5 border-l pl-2">
                      {category.groups.map((g) => (
                        <CheckRow
                          key={g.id}
                          id={`grp-${g.id}`}
                          label={g.name}
                          hint={g.scope}
                          checked={groups.has(g.id)}
                          onChange={(on) => setGroups(toggle(groups, [g.id], on))}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 4. Métiers (CLAUDE.md §3) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Métiers ciblés
            </CardTitle>
            <CardDescription>Postes à fort potentiel d&apos;investissement.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-0.5 sm:grid-cols-4">
            {targetRoles.map((role) => (
              <CheckRow
                key={role.id}
                id={`role-${role.id}`}
                label={role.label}
                checked={roles.has(role.id)}
                onChange={(on) => setRoles(toggle(roles, [role.id], on))}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Récapitulatif */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-muted-foreground">Pays</dt>
              <dd className="text-right font-medium">{match?.country.name ?? "—"}</dd>
              <dt className="text-muted-foreground">Universités</dt>
              <dd className="text-right font-medium tabular-nums">{universities.size}</dd>
              <dt className="text-muted-foreground">Groupes</dt>
              <dd className="text-right font-medium tabular-nums">{groups.size}</dd>
              <dt className="text-muted-foreground">Mode</dt>
              <dd className="text-right font-medium">
                {groupMode === "standalone" ? "Autonome" : "Croisé"}
              </dd>
              <dt className="text-muted-foreground">Métiers</dt>
              <dd className="text-right font-medium tabular-nums">{roles.size}</dd>
            </dl>
            <Separator />
            <div className="grid gap-2">
              <Label htmlFor="batch-size" className="flex items-center gap-1.5">
                <Users className="size-4 text-muted-foreground" />
                Taille du lot (profils)
              </Label>
              <Input
                id="batch-size"
                type="number"
                min={1}
                max={5000}
                step={10}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
              />
            </div>
            {state.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-destructive">{state.error}</p>
            )}
            <Button type="submit" size="lg" disabled={pending} className="w-full">
              {pending ? <Loader2 className="animate-spin" /> : <Rocket />}
              Créer la campagne
            </Button>
            <p className="text-xs text-muted-foreground">
              La campagne est créée en brouillon. Le lancement de l&apos;extraction arrive en phase 3.
            </p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
