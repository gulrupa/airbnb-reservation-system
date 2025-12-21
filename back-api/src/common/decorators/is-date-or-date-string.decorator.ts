import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsDateOrDateString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDateOrDateString',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === null || value === undefined) {
            return false;
          }

          // Si c'est déjà un objet Date
          if (value instanceof Date) {
            return !isNaN(value.getTime());
          }

          // Si c'est une string, vérifier les formats acceptés
          if (typeof value === 'string') {
            // Format ISO 8601 complet (avec heure)
            const iso8601Regex =
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
            // Format date simple (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

            if (iso8601Regex.test(value) || dateRegex.test(value)) {
              const date = new Date(value);
              return !isNaN(date.getTime());
            }
          }

          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date string (YYYY-MM-DD or ISO 8601 format)`;
        },
      },
    });
  };
}

