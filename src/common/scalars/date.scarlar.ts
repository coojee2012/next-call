import { Scalar } from '@nestjs/graphql';
import { Kind } from 'graphql';

@Scalar('Date')
export class DateScalar {
	description = 'Date custom scalar type';

	parseValue(value:any) {
		return new Date(value);
	}

	serialize(value:any) {
		return value.getTime();
	}

	parseLiteral(ast:any) {
		if (ast.kind === Kind.INT) {
			return parseInt(ast.value, 10); // ast value is always in string format
		}
		return null;
	}
}