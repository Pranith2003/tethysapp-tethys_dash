import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import NormalInput from "components/inputs/NormalInput";
import DataSelect from "components/inputs/DataSelect";

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const TimeSeriesPane = ({ sourceProps, setSourceProps }) => {
  const [isTimeEnabled, setIsTimeEnabled] = useState(
    !!sourceProps?.props?.TIME_ENABLED
  );
  const [autoFetch, setAutoFetch] = useState(
    !!sourceProps?.props?.TIME_AUTO_FETCH
  );
  const [startTime, setStartTime] = useState(
    sourceProps?.props?.TIME_START || ""
  );
  const [endTime, setEndTime] = useState(sourceProps?.props?.TIME_END || "");
  const [interval, setInterval] = useState(
    sourceProps?.props?.TIME_INTERVAL || "daily"
  );

  const handleTimeEnabledChange = (e) => {
    const enabled = e.target.checked;
    setIsTimeEnabled(enabled);
    setSourceProps((prev) => ({
      ...prev,
      props: {
        ...prev.props,
        TIME_ENABLED: enabled,
      },
    }));
    if (!enabled) {
      setAutoFetch(false);
      setSourceProps((prev) => ({
        ...prev,
        props: {
          ...prev.props,
          TIME_AUTO_FETCH: false,
          TIME_START: "",
          TIME_END: "",
          TIME_INTERVAL: "",
        },
      }));
    }
  };

  const handleAutoFetchChange = (e) => {
    const fetch = e.target.checked;
    setAutoFetch(fetch);
    setSourceProps((prev) => ({
      ...prev,
      props: {
        ...prev.props,
        TIME_AUTO_FETCH: fetch,
      },
    }));
    if (fetch) {
      setSourceProps((prev) => ({
        ...prev,
        props: {
          ...prev.props,
          TIME_START: "",
          TIME_END: "",
          TIME_INTERVAL: "",
        },
      }));
    }
  };

  const handleStartTimeChange = (e) => {
    setStartTime(e.target.value);
    setSourceProps((prev) => ({
      ...prev,
      props: {
        ...prev.props,
        TIME_START: e.target.value,
      },
    }));
  };

  const handleEndTimeChange = (e) => {
    setEndTime(e.target.value);
    setSourceProps((prev) => ({
      ...prev,
      props: {
        ...prev.props,
        TIME_END: e.target.value,
      },
    }));
  };

  const handleIntervalChange = (e) => {
    setInterval(e.target.value);
    setSourceProps((prev) => ({
      ...prev,
      props: {
        ...prev.props,
        TIME_INTERVAL: e.target.value,
      },
    }));
  };

  return (
    <div>
      <Row>
        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={isTimeEnabled}
            onChange={handleTimeEnabledChange}
          />
          Enable Time Support
        </label>
      </Row>
      {isTimeEnabled && (
        <>
          <Row>
            <label>
              <input
                type="checkbox"
                checked={autoFetch}
                onChange={handleAutoFetchChange}
              />
              Auto-fetch time from WMS GetCapabilities
            </label>
          </Row>
          {!autoFetch && (
            <>
              <Row>
                <NormalInput
                  label="Start Time"
                  type="date"
                  value={startTime}
                  onChange={handleStartTimeChange}
                />
                <NormalInput
                  label="End Time"
                  type="date"
                  value={endTime}
                  onChange={handleEndTimeChange}
                />
              </Row>
              <Row>
                <DataSelect
                  label="Interval"
                  selectedOption={{
                    value: interval,
                    label: interval.charAt(0).toUpperCase() + interval.slice(1),
                  }}
                  onChange={(e) =>
                    handleIntervalChange({ target: { value: e.value } })
                  }
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "hourly", label: "Hourly" },
                    { value: "monthly", label: "Monthly" },
                  ]}
                />
              </Row>
            </>
          )}
        </>
      )}
    </div>
  );
};

TimeSeriesPane.propTypes = {
  sourceProps: PropTypes.object,
  setSourceProps: PropTypes.func,
};

export default TimeSeriesPane;
