import axios from 'axios';
import { url } from '../utils/Utils';
import { ScanProps, ServerResponse } from '../types';

const urlScanAPI = async (props: ScanProps) => {
  try {
    const formData = new FormData();
    let s3url: string = '';
    if (props.source_type === 's3 bucket') {
      if (!props.urlParam?.endsWith('/')) {
        s3url = props?.urlParam + '/';
      } else {
        s3url = props?.urlParam;
      }
    }
    formData.append('uri', props?.userCredentials?.uri ?? '');
    formData.append('database', props?.userCredentials?.database ?? '');
    formData.append('userName', props?.userCredentials?.userName ?? '');
    formData.append('password', props?.userCredentials?.password ?? '');
    if (props.source_type === 's3 bucket') {
      formData.append('source_url', s3url ?? '');
    } else {
      formData.append('source_url', props?.urlParam ?? '');
    }
    formData.append('wiki_query', props?.wikiquery ?? '');
    formData.append('source_type', props?.source_type ?? '');
    if (props.model != undefined) {
      formData.append('model', props?.model);
    }
    if (props.accessKey?.length) {
      formData.append('aws_access_key_id', props?.accessKey);
    }
    if (props?.secretKey?.length) {
      formData.append('aws_secret_access_key', props?.secretKey);
    }
    if (props?.gcs_bucket_name) {
      formData.append('gcs_bucket_name', props.gcs_bucket_name);
    }
    if (props?.gcs_bucket_folder) {
      formData.append('gcs_bucket_folder', props.gcs_bucket_folder);
    }

    const response: ServerResponse = await axios.post(`${url()}/url/scan`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  } catch (error) {
    console.log('Error uploading file:', error);
    throw error;
  }
};

export { urlScanAPI };
