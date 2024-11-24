import { Transform } from 'class-transformer';

export const CastToNumberArray = () =>
  Transform(({ value }: { value: string }) => toNumberArray(value));

const toNumberArray = (value: any) => {
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .map((item) => parseInt(item, 10))
      .filter((item) => !isNaN(item));
  }

  return undefined;
};
