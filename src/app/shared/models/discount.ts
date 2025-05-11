export interface ISingleDiscount {
  id          :  number;
  isActive    :  boolean;
  name        :  string;
  amount      :  number;
  isPercentage:  boolean;
  startDate   ?:  string | null;         // DateTimeOffset → string
  endDate     ?: string | null;
}
