/**
 * @author Deniz Ugur <deniz343@gmail.com>
 */
import React from "react";
import styled from "styled-components";

const ProgressOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	z-index: 999;
	height: 100%;
	width: 100%;

	background-color: rgba(0, 0, 0, 0.8);

	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	font-size: 3rem;
	color: white;

    span {
        margin: 5vh;
    }
`;

export default function Overlay(props: any) {
	const { children, text, enable } = props;
	return (
		<>
			{children}
			{enable && (
				<ProgressOverlay>
					<img src="/assets/img/loading.gif" alt="loading gif" />
					<span>{text}</span>
				</ProgressOverlay>
			)}
		</>
	);
}
