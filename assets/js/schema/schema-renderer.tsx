import {render} from "preact";
import {useState, useEffect} from "preact/hooks";
import {jsonSchemaToModel} from "./json-schema-converter.ts";
import {crdYamlToModels, isYamlUrl} from "./crd-yaml-converter.ts";
import type {SchemaField as SchemaFieldType, SchemaModel as SchemaModelType, FieldVariant as FieldVariantType} from "./schema-model.types.ts";

// --- Helpers -----------------------------------------------------------------

const TYPE_CLASSES: Record<string, string> = {
    string: "sr-type--string",
    integer: "sr-type--number",
    number: "sr-type--number",
    boolean: "sr-type--boolean",
};

function typeClass(type: string): string {
    const base = type.replace("[]", "").toLowerCase();
    return TYPE_CLASSES[base] || (type.includes("[]") ? "sr-type--array" : "sr-type--object");
}

// --- Components --------------------------------------------------------------

function SchemaHeader({meta}: {meta: SchemaModelType["meta"]}) {
    const hasGrid = meta.apiVersions?.length > 0 || meta.kind;
    return (
        <div className="sr-header">
            {meta.description && <p className="sr-header__desc">{meta.description}</p>}
            {hasGrid && (
                <div className="sr-header__grid">
                    {meta.apiVersions?.length > 0 && (
                        <div className="sr-header__item">
                            <span className="sr-header__label">API Version</span>
                            {meta.apiVersions.map((v) => (
                                <code key={v} className="sr-header__value">{v}</code>
                            ))}
                        </div>
                    )}
                    {meta.kind && (
                        <div className="sr-header__item">
                            <span className="sr-header__label">Kind</span>
                            <code className="sr-header__value">{meta.kind}</code>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function FieldRow({field, depth = 0}: {field: SchemaFieldType; depth?: number}) {
    const [expanded, setExpanded] = useState(depth < 1);
    const hasNested = (field.properties?.length || 0) > 0;
    const hasVariants = (field.variants?.length || 0) > 0;
    const expandable = hasNested || hasVariants;

    const descContent = field.description
        ? <span>{field.description}</span>
        : <span className="sr-no-desc">No description</span>;

    return (
        <>
            <tr className="sr-field-row">
                <td className={`sr-field-name sr-depth-${Math.min(depth, 8)}`}>
                    <div className="sr-field-name-inner">
            <span className="sr-expand-space">
              {expandable && (
                  <button className="sr-expand-btn" onClick={() => setExpanded(!expanded)}
                          aria-label={expanded ? "Collapse" : "Expand"}>
                      {expanded ? "−" : "+"}
                  </button>
              )}
            </span>
                        <code className="sr-field-code">{field.name}</code>
                        {field.required && <span className="badge sr-badge--required">required</span>}
                        {field.immutable && <span className="badge sr-badge--immutable">immutable</span>}
                    </div>
                </td>
                <td className="sr-field-type">
                    <span className={`sr-type-badge ${typeClass(field.type)}`}>{field.type}</span>
                </td>
                <td className="sr-field-desc sr-field-desc--col">
                    {descContent}
                </td>
            </tr>
            <tr className="sr-field-row sr-field-desc-row">
                <td className="sr-field-desc" colSpan={2}>
                    {descContent}
                </td>
            </tr>
            {expanded && hasNested && field.properties!.map((sub) => (
                <FieldRow key={sub.name} field={sub} depth={depth + 1}/>
            ))}
            {expanded && hasVariants && (
                <VariantRows variants={field.variants!} depth={depth + 1}/>
            )}
        </>
    );
}

function VariantRows({variants, depth}: {variants: FieldVariantType[]; depth: number}) {
    const [active, setActive] = useState(0);
    const variant = variants[active];

    return (
        <>
            <tr className="sr-variant-tabs-row">
                <td colSpan={3} className={`sr-variant-tabs sr-depth-${Math.min(depth, 8)}`}>
                    {variants.map((v, i) => (
                        <button
                            key={v.title}
                            className={`sr-variant-tab ${i === active ? "sr-variant-tab--active" : ""}`}
                            onClick={() => setActive(i)}
                        >
                            {v.title}
                        </button>
                    ))}
                </td>
            </tr>
            {variant.description && (
                <tr className="sr-variant-desc-row">
                    <td colSpan={3} className={`sr-variant-desc sr-depth-${Math.min(depth, 8)}`}>
                        {variant.description}
                    </td>
                </tr>
            )}
            {variant.properties?.map((sub) => (
                <FieldRow key={`${active}-${sub.name}`} field={sub} depth={depth}/>
            ))}
        </>
    );
}

function FieldTable({title, description, fields}: {title: string; description: string; fields: SchemaFieldType[]}) {
    if (!fields?.length) return null;
    return (
        <div className="sr-section">
            <h3>{title}</h3>
            {description && <p className="sr-section__desc">{description}</p>}
            <div className="sr-table-wrap">
                <table className="sr-table">
                    <thead>
                    <tr>
                        <th>Field</th>
                        <th>Type</th>
                        <th className="sr-col-hidden">Description</th>
                    </tr>
                    </thead>
                    <tbody>
                    {fields.map((f) => <FieldRow key={f.name} field={f}/>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SchemaView({model, schemaUrl}: {model: SchemaModelType; schemaUrl: string}) {
    return (
        <>
            <SchemaHeader meta={model.meta}/>
            {model.sections.map((section) => (
                <FieldTable key={section.title} title={section.title}
                            description={section.description} fields={section.fields}/>
            ))}
            <div className="sr-footer">
                <ul>
                    <li>
                        <a href={schemaUrl} target="_blank" rel="noopener noreferrer">
                            View raw schema source
                        </a>
                    </li>
                </ul>
            </div>
        </>
    );
}

function parseResponse(text: string, url: string): SchemaModelType[] {
    if (isYamlUrl(url)) {
        return crdYamlToModels(text);
    }
    return [jsonSchemaToModel(JSON.parse(text))];
}

function SchemaRenderer({schemaUrl}: {schemaUrl: string}) {
    const [state, setState] = useState<"loading" | "done" | "error">("loading");
    const [models, setModels] = useState<SchemaModelType[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!schemaUrl) {
            setState("error");
            setError("No schema URL provided.");
            return;
        }

        fetch(schemaUrl)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then((text) => {
                setModels(parseResponse(text, schemaUrl));
                setState("done");
            })
            .catch((err) => {
                setError(err.message);
                setState("error");
            });
    }, [schemaUrl]);

    return (
        <div className="sr-root">
            {state === "loading" && (
                <div className="sr-section">
                    <h3>Schema</h3>
                    <div className="sr-skeleton sr-skeleton--block"/>
                </div>
            )}

            {state === "error" && (
                <div className="sr-section">
                    <h3>Schema</h3>
                    <div className="alert alert-danger" role="alert">
                        Failed to load schema: {error}
                    </div>
                </div>
            )}

            {state === "done" && models.map((model, i) => (
                <SchemaView key={`${model.meta.kind}-${model.meta.apiVersions[0] ?? i}`}
                            model={model} schemaUrl={schemaUrl}/>
            ))}
        </div>
    );
}

document.querySelectorAll("[data-schema-renderer]").forEach((el) => {
    render(<SchemaRenderer schemaUrl={(el as HTMLElement).dataset.schemaUrl || ""}/>, el);
});
