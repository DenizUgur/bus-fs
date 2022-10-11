/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
declare namespace Express {
	export interface Request {
		user: {
			oid: string;
			displayName: string;
			email: string;
			sid: string;
			enrolled: boolean;
			level: number;
			privileges: {
				editFiles?: string[];
				prohibitedTag?: string;
			};
		};
		session: any;
		logout: any;
	}
}
