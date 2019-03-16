import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class BookmarkOptionsPipe implements PipeTransform<string, object> {
    transform(value: string, metadata: ArgumentMetadata): object {
        return {
            first: value === 'first',
            only: value === 'only',
            ids: undefined,
        };
    }
}
