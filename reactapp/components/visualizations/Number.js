import PropTypes from "prop-types";
import styled from "styled-components";
import { memo, useMemo } from "react";

const StyledDiv = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const isValidNumber = (value) => {
  if (typeof value !== "string" && typeof value !== "number") return false;

  // Allows: -10, 0, 10, 10.5, -0.25
  return /^-?\d+(\.\d+)?$/.test(String(value).trim());
};

const Text = ({ textValue, visualizationRef }) => {
  const numberValue = useMemo(() => {
    if (!isValidNumber(textValue)) return null;
    return Number(textValue);
  }, [textValue]);
console.log("Number Value: ", numberValue, textValue);
  return (
    <StyledDiv ref={visualizationRef}>
      {numberValue !== null ? numberValue : "Invalid number"}
    </StyledDiv>
  );
};

Text.propTypes = {
  textValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  visualizationRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any }),
  ]),
};

export default memo(Text);