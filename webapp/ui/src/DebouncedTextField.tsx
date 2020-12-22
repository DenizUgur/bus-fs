import React, { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import { TextField } from "@material-ui/core";

export function DebouncedTextField(props: any) {
	const { label, value, onChange, helperText } = props;
	const [userQuery, setUserQuery] = useState(value);

	const updateQuery = () => {
		// A search query api call.
		onChange(userQuery);
	};

	const delayedQuery = useCallback(debounce(updateQuery, 500), [userQuery]);

	const onChangeHandler = (e: any) => {
		setUserQuery(e.target.value);
	};

	useEffect(() => {
		delayedQuery();
		return delayedQuery.cancel;
	}, [userQuery, delayedQuery]);

	return (
		<TextField
			label={label}
			helperText={helperText}
			onChange={onChangeHandler}
			value={userQuery}
		/>
	);
}
