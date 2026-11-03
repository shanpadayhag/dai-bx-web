type CardPropertyValue =
  | { propertyId: string; optionId: string }
  | { propertyId: string; text: string }
  | { propertyId: string; number: string };

export default CardPropertyValue;
