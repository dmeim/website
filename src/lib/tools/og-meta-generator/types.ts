/** Schema field / section types for the OG meta form (parity with it-tools). */

export type OGSelectOption = {
  label: string;
  value: string;
};

export type OGSelectGroup = {
  type: "group";
  label: string;
  key: string;
  children: OGSelectOption[];
};

export type OGSchemaTypeElementBase = {
  key: string;
  label: string;
  placeholder: string;
};

export type OGSchemaTypeElementInput = OGSchemaTypeElementBase & {
  type: "input";
};

export type OGSchemaTypeElementInputMultiple = OGSchemaTypeElementBase & {
  type: "input-multiple";
};

export type OGSchemaTypeElementSelect = OGSchemaTypeElementBase & {
  type: "select";
  options: Array<OGSelectOption | OGSelectGroup>;
};

export type OGSchemaTypeElement =
  | OGSchemaTypeElementInput
  | OGSchemaTypeElementInputMultiple
  | OGSchemaTypeElementSelect;

export type OGSchemaType = {
  name: string;
  elements: OGSchemaTypeElement[];
};

/** Form value: scalar string or multi-value list (for input-multiple). */
export type MetaFieldValue = string | string[];

/** Flat form state keyed by OG / twitter property names. */
export type OgFormMetadata = {
  [key: string]: MetaFieldValue;
};

export type MetadataFlat = {
  key: string;
  value: string;
};

export type GenerateMetaOptions = {
  indentation?: number;
  indentWith?: string;
  generateTwitterCompatibleMeta?: boolean;
};
