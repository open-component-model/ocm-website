import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { parseSchema, extractMeta } from "./schema-parser.js";

// --- Components --------------------------------------------------------------

function SchemaHeader({ meta }) {
  const hasGrid = meta.apiVersions?.length > 0 || meta.kind;
  return (
    <div class="sr-header">
      {meta.description && <p class="sr-header__desc">{meta.description}</p>}
      {hasGrid && (
        <div class="sr-header__grid">
          {meta.apiVersions?.length > 0 && (
            <div class="sr-header__item">
              <span class="sr-header__label">API Version</span>
              {meta.apiVersions.map((v) => (
                <code key={v} class="sr-header__value">{v}</code>
              ))}
            </div>
          )}
          {meta.kind && (
            <div class="sr-header__item">
              <span class="sr-header__label">Kind</span>
              <code class="sr-header__value">{meta.kind}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const TYPE_CLASSES = {
  string: "sr-type--string",
  integer: "sr-type--number",
  number: "sr-type--number",
  boolean: "sr-type--boolean",
};

function typeClass(type) {
  const base = type.replace("[]", "").toLowerCase();
  return TYPE_CLASSES[base] || (type.includes("[]") ? "sr-type--array" : "sr-type--object");
}

function FieldRow({ field, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasNested = field.properties?.length > 0;

  return (
    <>
      <tr class="sr-field-row">
        <td class={`sr-field-name sr-depth-${Math.min(depth, 8)}`}>
          <div class="sr-field-name-inner">
            <span class="sr-expand-space">
              {hasNested && (
                <button class="sr-expand-btn" onClick={() => setExpanded(!expanded)}
                  aria-label={expanded ? "Collapse" : "Expand"}>
                  {expanded ? "−" : "+"}
                </button>
              )}
            </span>
            <code class="sr-field-code">{field.name}</code>
            {field.required && <span class="badge sr-badge--required">required</span>}
            {field.immutable && <span class="badge sr-badge--immutable">immutable</span>}
          </div>
        </td>
        <td class="sr-field-type">
          <span class={`sr-type-badge ${typeClass(field.type)}`}>{field.type}</span>
        </td>
        <td class="sr-field-desc">
          {field.description
            ? <span>{field.description}</span>
            : <span class="sr-no-desc">No description</span>}
        </td>
      </tr>
      {expanded && hasNested && field.properties.map((sub) => (
        <FieldRow key={sub.name} field={sub} depth={depth + 1} />
      ))}
    </>
  );
}

function FieldTable({ title, description, fields }) {
  if (!fields?.length) return null;
  return (
    <div class="sr-section">
      <h3>{title}</h3>
      {description && <p class="sr-section__desc">{description}</p>}
      <div class="sr-table-wrap">
        <table class="sr-table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Field</th>
              <th style={{ width: "15%" }}>Type</th>
              <th style={{ width: "45%" }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => <FieldRow key={f.name} field={f} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SchemaRenderer({ schemaUrl }) {
  const [state, setState] = useState("loading");
  const [sections, setSections] = useState([]);
  const [meta, setMeta] = useState({});
  const [error, setError] = useState(null);

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
        const data = JSON.parse(text);
        setSections(parseSchema(data));
        setMeta(extractMeta(data));
        setState("done");
      })
      .catch((err) => {
        setError(err.message);
        setState("error");
      });
  }, [schemaUrl]);

  return (
    <div class="sr-root">
      {state === "done" && <SchemaHeader meta={meta} />}

      {state === "loading" && (
        <div class="sr-section">
          <h3>Schema</h3>
          <div class="sr-skeleton sr-skeleton--block" />
        </div>
      )}

      {state === "error" && (
        <div class="sr-section">
          <h3>Schema</h3>
          <div class="alert alert-danger" role="alert">
            Failed to load schema: {error}
          </div>
        </div>
      )}

      {state === "done" && sections.map((section) => (
        <FieldTable key={section.title} title={section.title}
          description={section.description} fields={section.fields} />
      ))}

      {state === "done" && (
        <div class="sr-footer">
          <a href={schemaUrl} target="_blank" rel="noopener noreferrer">
            View raw schema source
          </a>
        </div>
      )}
    </div>
  );
}

document.querySelectorAll("[data-schema-renderer]").forEach((el) => {
  render(<SchemaRenderer schemaUrl={el.dataset.schemaUrl || ""} />, el);
});
