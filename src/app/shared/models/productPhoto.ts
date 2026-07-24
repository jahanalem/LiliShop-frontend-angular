
export interface IProductPhoto {
  id      : number;
  url     : string;
  isMain  : boolean;
  publicId: string;
  /**
   * Ids of the attribute values assigned to this photo ("structured hashtags", Plan B).
   * Empty/absent for untagged photos. Display names are resolved from the assignable-values
   * endpoint / attribute catalog so localization stays server-side.
   */
  attributeValueIds?: number[];
}

/**
 * One attribute value that may be assigned to a product's photos: a value already used by one of
 * the product's variants. Carries its attribute context so the admin can render an unambiguous
 * "Size: Large" chip instead of a bare "#Large".
 */
export interface IPhotoAttributeValueOption {
  attributeId  : number;
  attributeName: string;
  displayOrder : number;
  valueId      : number;
  valueName    : string;
  colorHex?    : string | null;
  sortOrder    : number;
}

