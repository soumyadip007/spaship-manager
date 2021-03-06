import { Gallery, GalleryItem, PageSection, PageSectionVariants, Title } from "@patternfly/react-core";
import { useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { IConfig } from "../../config";
import useConfig from "../../hooks/useConfig";
import Page from "../../layout/Page";
import { get } from "../../utils/APIUtil";
import DashboardProperty from "./DashboardIndexProperty";
import LatestActivitiesByProperty from "./LatestActivitiesByProperty";
import PropertyEnvChart from "./PropertyEnvChart";
import PropertyEnvMonthChart from "./PropertyEnvMonthChart.jsx";
import PropertyTimeToDeployChart from "./PropertyTimeToDeployChart";
import { Button, Level, LevelItem } from "@patternfly/react-core";
import SearchFilter from "../property/SearchFilter";
import NewPropertyModal from "../property/NewPropertyModal";

export default () => {
  const { selected, website, setSPAConfig,  env } = useConfig();
  const { propertyName } = useParams<{ propertyName: string }>();
  const [event, setEvent] = useState([]);
  const history = useHistory();
  const [isModalOpen, setModalOpen] = useState(false);

  
  const onSelect = async (spaName: string, propertyName: string) => {
    const spaConfig = { name: spaName};
    setSPAConfig(spaConfig);
    history.push(`/dashboard/${propertyName}/spaName/${spaName}`);
  }
  const getEventData = fetchEventData(selected, propertyName, setEvent, env);

  useEffect(() => {
    getEventData();
  }, [selected]);

  const handleSubmit = (conf: IConfig) => {
    setModalOpen(false);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  const handleClick = () => {
    setModalOpen(true);
  };
  
  const eventResponse = [];
  if (event) {
    for (let item of event) {
      const value = JSON.parse(JSON.stringify(item));
      eventResponse.push(value);
    }
  }

  const titleToolbar = (
    <>
    <Level hasGutter>
      <LevelItem>
        <SearchFilter></SearchFilter>
      </LevelItem>
      <LevelItem>
        <Button onClick={handleClick} id="add-application-button" variant="primary">
          Add New Repository
        </Button>
      </LevelItem>
    </Level>
    <NewPropertyModal isModalOpen={isModalOpen} onClose={handleClose} onSubmit={handleSubmit} />
    </>
  );

  return (
    <>
      <Page title="Dashboard - Property Deployment" titleToolbar={titleToolbar}>
        <PageSection variant={PageSectionVariants.light} isFilled>
          <Gallery hasGutter style={{ width: "90%" }}>
            {eventResponse.map((e) => (
              <GalleryItem key={e.id} >
                <DashboardProperty config={e} selectedName={e.spaName} propertyName={propertyName} onSelect={onSelect} />
              </GalleryItem>
            ))}
          </Gallery>
        </PageSection>

        <PageSection variant={PageSectionVariants.light} isFilled>
          <Title headingLevel="h1">Deployment Metrics</Title>
          <Gallery hasGutter style={{ width: "90%" }}>
            <GalleryItem >
              <PropertyEnvChart propertyNameRequest={propertyName}></PropertyEnvChart>
            </GalleryItem>
            <GalleryItem >
              <PropertyEnvMonthChart propertyNameRequest={propertyName}></PropertyEnvMonthChart>
            </GalleryItem>
          </Gallery>

          <Title headingLevel="h1">Time to Deploy Metrics</Title>
          <Gallery hasGutter style={{ width: "90%" }}>
            <GalleryItem >
              <PropertyTimeToDeployChart propertyNameRequest={propertyName}></PropertyTimeToDeployChart>
            </GalleryItem>
          </Gallery>

          <Title headingLevel="h1">Property Latest Activites</Title>
          <br></br>
          <LatestActivitiesByProperty propertyNameRequest={propertyName} />
        </PageSection>
        
      </Page>
    </>
  );
};

function fetchEventData(selected: IConfig | undefined, propertyName: string, setEvent: any, env: any) {
  return async () => {
    try {
      const url = env.managerPath + `/event/get/${propertyName}/count/property/spaname`;
      setEvent([]);
      if (url) {
        const data = await get<any>(url);
        console.log(data);
        setEvent(data);
      }
    } catch (e) {
      console.log(e);
    }
  };
}