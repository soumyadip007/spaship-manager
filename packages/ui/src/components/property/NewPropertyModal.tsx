import {
  Button, Card, CardBody,
  CardHeader, CardTitle, Form, FormGroup, Modal, ModalVariant, TextInput
} from "@patternfly/react-core";
import axios from "axios";
import { useEffect, useState } from "react";
import Select from "react-select";
import { IConfig, SPAConfigutation } from "../../config";
import useConfig from "../../hooks/useConfig";
import { post } from "../../utils/APIUtil";

interface IProps {
  websiteName?: string;
  isModalOpen: boolean;
  onClose: () => void;
  onSubmit: (conf: IConfig) => void;
}

const configTemplate: IConfig = {
  name: "",
  environments: [
    {
      name: "",
      api: "",
      domain: "",
    },
  ],
};


export default (props: IProps) => {
  const { env, website } = useConfig();
  const { isModalOpen, onClose, onSubmit } = props;
  const [responseModal, setResponseModal] = useState(false);

  const [config, setConfig] = useState<IConfig>(configTemplate);
  const [validated, setValidated] = useState<"success" | "error" | "default">("default");
  const [websiteName, setWebsiteName] = useState("");


  const [repositoryLink, setRepositoryLink] = useState("");
  const [gitlabProjectId, setGitlabProjectId] = useState("");
  const [branch, setBranch] = useState("");
  const [token, setToken] = useState("");
  const [spaFilePathRequest, setSpaFilePathRequest] = useState<any[]>([]);

  const [response, setResponse] = useState({});

  const [treePath, setTreePath] = useState<any[]>([]);
  const [filePath, setFilePath] = useState<any[]>([]);
  const [event, setEvent] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState<any>(false);

  //const { keycloak, initialized } = useKeycloak();
  //const tokenKeyClock = keycloak.tokenParsed as ISPAshipJWT;


  const handleWebsiteNameChange = (value: string) => {
    setWebsiteName(value);
  };


  const handleConfirm = () => {
    const spaResponse = spaFilePathRequest.filter(item => item.isActive === true)
    const websiteRequest = {
      websiteName: websiteName,
      //ownerName : tokenKeyClock.name,
      //ownerEmail: tokenKeyClock.email,
      repositoryConfigs: [
        {
          repositoryLink: repositoryLink,
          branch: branch,
          gitToken: token,
          spas: spaResponse
        }
      ]
    };
    console.log(JSON.stringify(websiteRequest));
    sendRequestToActions(env, websiteRequest);

    setModalOpen(true);
    // onClose();'
  };


  const handleModalToggleOkay = () => {
    setEvent([]);
    setSpaFilePathRequest([]);
    setFilePath([]);
    setTreePath([]);
    setBranch("");
    setToken("");
    setRepositoryLink("");
    setModalOpen(false);
  }

  const handleModalToggleDeny = () => {
    setModalOpen(false);
    onClose();
  }


  const handleClose = () => {
    setConfig(configTemplate);
    onClose();
  };

  useEffect(() => {
    if (websiteName == "") {
      setWebsiteName(website);
    }
    if (repositoryLink.length > 23) {
      let repositoryKeys = repositoryLink.split('/');
      if (repositoryKeys.includes("github.com")) {
        axios.get(`https://api.github.com/repos/${repositoryKeys[3]}/${repositoryKeys[4]}/branches`)
          .then(res => {
            if (res.data.length != 0 && res.data.length != event.length) {
              setEvent(res.data);
            }
          })
      }
      else if (repositoryKeys.includes("gitlab.com")) {
        axios.get(`https://gitlab.com/api/v4/projects?search=${repositoryKeys[4]}`)
          .then(res => {
            const response = res.data;
            for (let item of response) {
              if (item?.namespace.path == repositoryKeys[3]) {
                axios.get(`https://gitlab.com/api/v4/projects/${item?.id}/repository/branches`)
                  .then(res => {
                    if (res.data.length != 0 && res.data.length != event.length) {
                      setEvent(res.data);
                      setGitlabProjectId(item.id);
                    }
                  })
                break;
              }
            }
          })
      }
    }
    if (treePath.length > 0) {
      const tempPath = [];
      const tempSpaFilePathRequest = [];
      let i = 1;
      for (let item of treePath) {
        console.log(item);
          const pathRequest = {
            id: i++,
            name: item,
            context: item,
            envs: ['prod', 'develop', 'stage'],
            //isChecked : true,
          }
          const spaFilePathRequestItem = { spaName: item, contextPath: item, envs: ['prod', 'develop', 'stage'], isActive: false, envStr: 'prod,dev,stage' };
          tempSpaFilePathRequest.push(spaFilePathRequestItem);
          tempPath.push(pathRequest);
      }
      setSpaFilePathRequest(tempSpaFilePathRequest);
      setFilePath(tempPath);
    }

  }, [event, repositoryLink, treePath, website]);

  const handleNameChange = (value: string) => {
    setRepositoryLink(value);
  };

  const handleTokenChange = (value: string) => {
    setToken(value);
  }

  const handleBranchChange = (value: any) => {
    setBranch(value.name);
    let repositoryKeys = repositoryLink.split('/');
    console.log('Handeling Branch');
    const websiteRequest = {
      websiteName: websiteName,
          repositoryLink: repositoryLink,
          branch: value.name,
    };
    getSPAData(env, websiteRequest);
    // if (repositoryKeys.includes("github.com")) {
    //   axios.get(`https://api.github.com/repos/${repositoryKeys[3]}/${repositoryKeys[4]}/branches/${value.name}`)
    //   .then(res => {
    //     if (res.data.length != 0 && res.data.length != event.length) {
    //       const treeURL = res.data.commit.commit.tree.url;
    //       axios.get(treeURL)
    //         .then(resPath => {
    //           setTreePath(resPath.data.tree);
    //         })
    //     }
    //   })
    // }
    // else if (repositoryKeys.includes("gitlab.com")) {
      
    //   axios.get(`https://gitlab.com/api/v4/projects/${gitlabProjectId}/repository/tree`)
    //         .then(resPath => {
              
    //           setTreePath(resPath.data);
    //         })
    // }
  };


  async function getSPAData(env: any, websiteRequest: { websiteName: string; repositoryLink: string; branch: string;  }) {
    try {
      const url = env.managerPath + "/website/analyze/repository";
      if (url) {
        const data = await post<any>(url, websiteRequest);
        setTreePath(data.analyzedFiles);
      }
    } catch (e) {
      console.log(e);
    }
  }

  const onAddingItem = (i: any) => (event: any) => {
    for (let j = 0; j < spaFilePathRequest.length; j++) {
      if (spaFilePathRequest[j].spaName == filePath[i].name) {
        if (spaFilePathRequest[j].isActive == false)
          spaFilePathRequest[j].isActive = true;
        else
          spaFilePathRequest[j].isActive = false;

        break;
      }
    }
    
  }

  const onAddingContext = (i: any) => (event: any) => {
    spaFilePathRequest[i].contextPath = event;
  }

  const onAddingEnvs = (i: any) => (event: any) => {
    spaFilePathRequest[i].envStr = event;
    spaFilePathRequest[i].envs = event.split(",");
  }

  const handleModalToggle = () => {
    setResponseModal(!responseModal);
  };

  return (
    <>
      <Modal
        variant="large"
        title="New Website"
        isOpen={isModalOpen}
        onClose={onClose}
        actions={[
          <Button key="add-property" variant="primary" onClick={handleConfirm} >
            Submit
          </Button>,
          <Button key="cancel-property" variant="link" onClick={handleClose}>
            Cancel
          </Button>,
        ]}
      >
        <Form isHorizontal>
          <FormGroup
            label="Wesite Name"
            isRequired
            fieldId="horizontal-form-name"
            helperText="Please provide the website name"
          >
            <TextInput
              isRequired
              type="text"
              id="horizontal-form-name"
              aria-describedby="horizontal-form-name-helper"
              name="horizontal-form-name"
              onChange={handleWebsiteNameChange}
              value={websiteName}
            />
          </FormGroup>
          <FormGroup label="Repository Configs" fieldId="horizontal-form-exp">

            <>
              <Card isFlat>
                <CardHeader>
                  <CardTitle>Please put the Credentials.</CardTitle>
                </CardHeader>

                <CardBody>
                  <FormGroup
                    label={`Repository Link`}
                    isRequired
                    fieldId="horizontal-form-repository"
                    helperText={`Please provide the Repository Link`}
                  >
                    <TextInput
                      isRequired
                      type="text"
                      id="horizontal-form-name"
                      aria-describedby="horizontal-form-name-helper"
                      name="horizontal-form-name"
                      onChange={handleNameChange}
                      value={repositoryLink}
                    />
                  </FormGroup>
                  <br></br>
                  <FormGroup
                    label={`Git API Token`}
                    isRequired
                    fieldId="horizontal-form-token"
                    helperText={`Please provide the Git API Token`}
                  >
                    <TextInput
                      isRequired
                      type="text"
                      id="horizontal-form-api"
                      aria-describedby="horizontal-form-name-helper"
                      name="horizontal-form-name"
                      onChange={handleTokenChange}
                    />
                  </FormGroup>
                  <br></br>
                  <FormGroup
                    label={`Git Branch`}
                    isRequired
                    fieldId="horizontal-form-token"
                    helperText={`Please aselect the Git Branch`}
                  >
                    <Select
                      placeholder="Select Git Branch"
                      id="horizontal-form-branch"
                      options={event}
                      onChange={handleBranchChange}
                      getOptionLabel={x => x.name}
                      getOptionValue={x => x.name}
                    />
                  </FormGroup>
                  <br></br>
                  <FormGroup
                    label={`SPA Paths`}
                    isRequired
                    fieldId="horizontal-form-token"
                    helperText={`Please select the SPAs`}
                  >
                    <table>
                      <tbody>
                        <tr>
                          <td><b>No.  &nbsp; &nbsp;</b></td>
                          <td><b>SPA Name  &nbsp; &nbsp;</b></td>
                          <td><b>Context Path  &nbsp; &nbsp;</b></td>
                          <td><b>&nbsp;Envs &nbsp; &nbsp;</b></td>
                        </tr>
                        <br></br>
                        {filePath.map((filePathItem, i) => {
                          return (

                            <tr key={i + 1}>
                              <td><b>{i + 1}. &nbsp;</b></td>
                              <td>
                                <div >
                                  <label>
                                    <input type="checkbox" value={filePathItem.name} checked={filePathItem.isChecked} onChange={onAddingItem(i)} />
                                    <span>&nbsp;&nbsp;{filePathItem.name} </span>
                                  </label>
                                </div>
                              </td>

                              <td>
                                <div >
                                  <TextInput
                                    isRequired
                                    type="text"
                                    value={spaFilePathRequest[i].context}
                                    id="horizontal-form-api"
                                    aria-describedby="horizontal-form-name-helper"
                                    name="horizontal-form-name"
                                    onChange={onAddingContext(i)}
                                  />
                                </div>
                              </td>


                              <td>
                                <div >
                                  <TextInput
                                    isRequired
                                    type="text"
                                    value={spaFilePathRequest[i].env}
                                    id="horizontal-form-envs"
                                    aria-describedby="horizontal-form-envs-helper"
                                    name="horizontal-form-envs"
                                    onChange={onAddingEnvs(i)}
                                  />
                                </div>
                              </td>
                            </tr>

                          )
                        })}
                      </tbody>
                    </table>
                  </FormGroup>
                </CardBody>
              </Card>
              <br />
            </>
          </FormGroup>
        </Form>
      </Modal>

      <Modal
        title="Simple modal header"
        variant={ModalVariant.small}
        isOpen={modalOpen}
        onClose={handleModalToggleDeny}
        actions={[
          <Button key="confirm" variant="primary" onClick={handleModalToggleOkay}>
            Confirm
          </Button>,
          <Button key="cancel" variant="link" onClick={handleModalToggleDeny} >
            Cancel
          </Button>
        ]}
      >
        Do you want to add another Repository ?
      </Modal>

    </>
  );
};
async function sendRequestToActions(env: any, websiteRequest: { websiteName: string; repositoryConfigs: { repositoryLink: string; branch: string; gitToken: string; spas: any[]; }[]; }) {
  try {
    const url = env.managerPath + "/website";
    if (url) {
      const data = await post<any>(url, websiteRequest);
      console.log('Response');
      console.log(data);
      alert(`SPA has been deployed, ${data.path}`);
      fetch(data.path, {
        method: 'GET',
        headers: {
        },
      })
        .then((response) => response.blob())
        .then((blob) => {
          const url = window.URL.createObjectURL(
            new Blob([blob]),
          );
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            data.websiteResponse.websiteId,
          );
          document.body.appendChild(link);
          link.click();
          link.parentNode?.removeChild(link);
        });
    }
  } catch (e) {
    console.log(e);
  }
}


