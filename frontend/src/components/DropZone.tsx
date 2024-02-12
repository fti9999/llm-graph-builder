import { Dropzone } from '@neo4j-ndl/react';
import { useState, useEffect, FunctionComponent } from 'react';
import Loader from '../utils/Loader';
import { uploadAPI } from '../services/Upload';
import { v4 as uuidv4 } from 'uuid';
import { useCredentials } from '../context/UserCredentials';
import { useFileContext } from '../context/UsersFiles';
import { getFileFromLocal, saveFileToLocal } from '../utils/utils';
import { CustomFile } from '../types';

const DropZone: FunctionComponent<{ isBackendConnected: Boolean }> = (props) => {
  const { files, filesData, setFiles, setFilesData } = useFileContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClicked, setIsClicked] = useState<boolean>(false);
  const { userCredentials } = useCredentials();

  const onDropHandler = (f: Partial<globalThis.File>[]) => {
    setIsClicked(true);
    f.forEach((i) => saveFileToLocal(i));
    setIsLoading(false);
    if (f.length) {
      const defaultValues: CustomFile = {
        processing: 'None',
        status: 'None',
        NodesCount: 0,
        id: uuidv4(),
        relationshipCount: 0,
        type: 'PDF',
        model: 'Diffbot',
      };

      const copiedFilesData: CustomFile[] = [...filesData];
      const copiedFiles: File[] = [...files];

      f.forEach((file) => {
        const filedataIndex = copiedFilesData.findIndex((filedataitem) => filedataitem?.name === file?.name);
        const fileIndex = copiedFiles.findIndex((filedataitem) => filedataitem?.name === file?.name);
        if (filedataIndex == -1) {
          copiedFilesData.push({
            name: file.name,
            type: file.type,
            size: file.size,
            ...defaultValues,
          });
        } else {
          const tempFileData = copiedFilesData[filedataIndex];
          copiedFilesData.splice(filedataIndex, 1);
          copiedFilesData.push({
            ...tempFileData,
            status: defaultValues.status,
            NodesCount: defaultValues.NodesCount,
            relationshipCount: defaultValues.relationshipCount,
            processing: defaultValues.processing,
            model: defaultValues.model,
          });
        }
        if (fileIndex == -1) {
          copiedFiles.push(file as File);
        } else {
          const tempFile = copiedFiles[filedataIndex];
          copiedFiles.splice(fileIndex, 1);
          copiedFiles.push(getFileFromLocal(tempFile.name) ?? tempFile);
        }
      });
      setFiles(copiedFiles);
      setFilesData(copiedFilesData);
    }
  };

  const fileUpload = async (file: File, uid: number) => {
    if (filesData[uid].status == 'None' && isClicked) {
      const apirequests = [];
      try {
        setIsLoading(true);
        setFilesData((prevfiles) =>
          prevfiles.map((curfile, idx) => {
            if (idx == uid) {
              return {
                ...curfile,
                status: 'Uploading',
              };
            } else {
              return curfile;
            }
          })
        );
        console.log('Before API CALL', file);
        const apiResponse = await uploadAPI(file, userCredentials);
        apirequests.push(apiResponse);
        Promise.allSettled(apirequests)
          .then((r) => {
            r.forEach((apiRes) => {
              if (apiRes.status === 'fulfilled' && apiRes.value) {
                if (apiRes?.value?.data != 'Unexpected Error') {
                  setFilesData((prevfiles) =>
                    prevfiles.map((curfile, idx) => {
                      if (idx == uid) {
                        return {
                          ...curfile,
                          status: 'New',
                        };
                      } else {
                        return curfile;
                      }
                    })
                  );
                  setIsLoading(false);
                } else {
                  throw new Error('API Failure');
                }
              }
            });
            setIsClicked(false);
          })
          .catch((err) => console.log(err));
      } catch (err) {
        console.log(err);
        setIsLoading(false);
        setIsClicked(false);
        setFilesData((prevfiles) =>
          prevfiles.map((curfile, idx) => {
            if (idx == uid) {
              return {
                ...curfile,
                status: 'Failed',
                type: curfile.type?.split('/')[1]?.toUpperCase() ?? 'PDF',
              };
            } else {
              return curfile;
            }
          })
        );
      }
    }
  };

  useEffect(() => {
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        fileUpload(files[i], i);
      }
    }
  }, [files]);

  return (
    <>
      {props.isBackendConnected && (
        <Dropzone
          loadingComponent={isLoading && <Loader />}
          isTesting={true}
          className='w-full h-full'
          dropZoneOptions={{
            accept: { 'application/pdf': ['.pdf'] },
            onDrop: (f: Partial<globalThis.File>[]) => {
              onDropHandler(f);
            },
          }}
        />
      )}
    </>
  );
};

export default DropZone;
