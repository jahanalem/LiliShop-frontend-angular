// Enum for discount target types (matches server values)
export enum DiscountTargetType {
  All          = 'All',
  ProductBrand = 'ProductBrand',
  ProductType  = 'ProductType',
  //Size         = 'Size',
  //Product      = 'Product',
}
export interface ITargetEntityOption {
  label: string;
  value: number;
}
export interface ITierOption {
  label: string;
  value: number;
}

export interface IDiscount {
  id           ?: number;
  name         :  string;
  startDate    :  string;
  endDate      :  string;
  isActive     :  boolean;
  discountGroup?: IDiscountGroup;
  tiers        ?: IDiscountTier[];
}
export interface IDiscountGroup {
  name           : string;
  conditionGroups: IConditionGroup[];
}
export interface IConditionGroup {
  tierIndex : number;
  conditions: IDiscountGroupCondition[];
}
export interface IDiscountGroupCondition {
  targetEntity  :  DiscountTargetType;
  targetEntityId?: number;
  shouldNotify  ?: boolean;
}
export interface IDiscountTier {
  id            ?: number;
  amount        :  number;
  isPercentage  :  boolean;
  isFreeShipping:  boolean;
}

// Example of creating a discount object that matches the JSON
const betaSaleDiscount: IDiscount = {
  id: 89,
  name: "BETA Sale",
  startDate: "2025-05-07T00:00:00Z",
  endDate: "2025-05-20T23:59:59Z",
  isActive: true,
  discountGroup: {
    name: "BETAGroup2025",
    conditionGroups: [
      {
        tierIndex: 0,
        conditions: [
          { targetEntity: DiscountTargetType.ProductBrand, targetEntityId: 5 },
          { targetEntity: DiscountTargetType.ProductType, targetEntityId: 1 }
        ]
      },
      {
        tierIndex: 1,
        conditions: [
          { targetEntity: DiscountTargetType.ProductBrand, targetEntityId: 1 },
          { targetEntity: DiscountTargetType.ProductType, targetEntityId: 2 }
        ]
      },
      {
        tierIndex: 2,
        conditions: [
          { targetEntity: DiscountTargetType.ProductBrand, targetEntityId: 2 }
        ]
      },
      {
        tierIndex: 2,
        conditions: [
          { targetEntity: DiscountTargetType.ProductBrand, targetEntityId: 4 },
          { targetEntity: DiscountTargetType.ProductType, targetEntityId: 3 }
        ]
      }
    ]
  },
  tiers: [
    {
      id: 9,
      amount: 68,
      isPercentage: true,
      isFreeShipping: false
    },
    {
      id: 10,
      amount: 73,
      isPercentage: true,
      isFreeShipping: true
    },
    {
      id: 11,
      amount: 78,
      isPercentage: true,
      isFreeShipping: true
    }
  ]
};
