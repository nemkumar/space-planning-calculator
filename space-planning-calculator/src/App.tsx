import "./App.css";
import {
  getConstraintsPaths,
  getSiteLimitsPaths,
  renderGeoJSONs,
} from "./extensionSdk";
import {
  fetchConstraintsFootprints,
  fetchSiteLimitFootprint,
} from "./fetchGeometryHook";
import {
  createFeatureCollection,
  generateOption,
} from "./generativeDesignEngine";
import { InputParametersType } from "./type";
import { DoubleHandleSlider, SingleHandleSlider } from "./components/sliders";
import { useState } from "react";
import { getObjectiveFunctionValue } from "./objectiveFunction";
import { polygon } from "@turf/turf";
import { optimize } from "./geneticAlgorithm";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "weave-slider": {
        value: number;
        valueto?: number;
        min: number;
        max: number;
        step: number;
        variant: "discrete" | "continuous";
        label: string;
        showlabel?: boolean;
        // onChange: (event: CustomEvent) => void;
        onInput: (event: CustomEvent) => void;
      };
      "weave-progress-bar": {
        "percent-complete"?: number;
      };
      "weave-button": {
        // children component
        children: React.ReactNode;
        label: string;
        type: "button" | "submit" | "reset";
        variant: "solid" | "flat";
        onClick: () => void;
        disabled?: boolean;
      };
    }
  }
}

const ParametersInput = (props: {
  inputParameters: InputParametersType;
  setInputParameters: (inputParameters: InputParametersType) => void;
}) => {
  const { inputParameters, setInputParameters } = props;
  return (
    <>
      <DoubleHandleSlider
        label={"Width range"}
        range={inputParameters.widthRange}
        onChange={(value: [number, number]) => {
          setInputParameters({ ...inputParameters, widthRange: value });
        }}
      />
      <DoubleHandleSlider
        label={"Height range"}
        range={inputParameters.heightRange}
        onChange={(value: [number, number]) => {
          setInputParameters({ ...inputParameters, heightRange: value });
        }}
      />
      <SingleHandleSlider
        label={"Land optimization ratio"}
        min={0}
        max={100}
        unit={"%"}
        value={inputParameters.landOptimizationRatio}
        onChange={(value: number) => {
          setInputParameters({
            ...inputParameters,
            landOptimizationRatio: value,
          });
        }}
      />
      <SingleHandleSlider
        label={"Space between buildings"}
        min={0}
        max={20}
        unit="m"
        value={inputParameters.spaceBetweenBuildings}
        onChange={(value: number) => {
          setInputParameters({
            ...inputParameters,
            spaceBetweenBuildings: value,
          });
        }}
      />
    </>
  );
};

function App() {
  const onClick = async () => {
    const constraintsPaths = await getConstraintsPaths();
    const siteLimit = await getSiteLimitsPaths();

    const constraintsGeojson = await fetchConstraintsFootprints(
      constraintsPaths
    );
    const siteLimitFootprint = await fetchSiteLimitFootprint(siteLimit);
    // mock longer fetch
    // TODO: REMOVE
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (!siteLimitFootprint) return;
    const finalOption = optimize(
      constraintsGeojson,
      siteLimitFootprint,
      inputParameters.landOptimizationRatio,
      inputParameters.spaceBetweenBuildings,
      inputParameters.widthRange,
      inputParameters.heightRange,
      10,
      1000,
      200
    );

    await renderGeoJSONs(finalOption);
  };

  const [inputParameters, setInputParameters] = useState<InputParametersType>({
    widthRange: [0, 50],
    heightRange: [0, 50],
    landOptimizationRatio: 50,
    spaceBetweenBuildings: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <div className="App">
      <h1>Warehouse Planning</h1>
      <ParametersInput
        inputParameters={inputParameters}
        setInputParameters={setInputParameters}
      />
      <div style={{ width: "100%", padding: "24px 0" }}>
        <weave-button
          label="Calculate"
          type="button"
          variant="solid"
          onClick={() => {
            setIsLoading(true);
            onClick().then(() => setIsLoading(false));
          }}
          disabled={isLoading}
        >
          Calculate
        </weave-button>
        {isLoading && (
          <div style={{ width: "100%", padding: "24px 0" }}>
            {" "}
            <weave-progress-bar />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
