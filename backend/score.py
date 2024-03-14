from fastapi import FastAPI, File, UploadFile, Form
import uvicorn
from fastapi import FastAPI, Depends
from fastapi_health import health
from fastapi.middleware.cors import CORSMiddleware
from src.main import *

def healthy_condition():
    output={"healthy": True}
    return output

def healthy():
    return True

def sick():
    return False

app = FastAPI();

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_api_route("/health", health([healthy_condition, healthy]))

@app.post('/sources')
async def create_source_knowledge_graph(uri= Form(), userName= Form(), password= Form(),file: UploadFile = File(...)):
    return create_source_node_graph(uri, userName, password, file)

@app.post('/extract')
async def extract_knowledge_graph_from_file(uri= Form(), userName= Form(), password= Form(),file: UploadFile = File(...), model=Form()):
    return extract_graph_from_file(uri, userName, password, file, model)

@app.get('/sources_list')
async def get_source_list():
    return get_source_list_from_graph()

@app.post("/url/scan")
async def create_source_knowledge_graph_url(
    uri=Form(None),
    userName=Form(None),
    password=Form(None),
    source_url=Form(),
    database=Form(None),
    aws_access_key_id=Form(None),
    aws_secret_access_key=Form(None),
    max_limit=Form(5),
    query_source=Form(None),
    model=Form(None)
):
    return create_source_node_graph_url(
        uri, userName, password, source_url, model, database, aws_access_key_id, aws_secret_access_key
    )


@app.post("/extract")
async def extract_knowledge_graph_from_file(
    uri=Form(None),
    userName=Form(None),
    password=Form(None),
    model=Form(None),
    database=Form(None),
    file: UploadFile = File(None),
    source_url=Form(None),
    aws_access_key_id=Form(None),
    aws_secret_access_key=Form(None),
    wiki_query=Form(None),
    max_sources=Form(None),
):
    """
    Calls 'extract_graph_from_file' in a new thread to create Neo4jGraph from a
    PDF file based on the model.

    Args:
          uri: URI of the graph to extract
          userName: Username to use for graph creation
          password: Password to use for graph creation
          file: File object containing the PDF file
          model: Type of model to use ('Diffbot'or'OpenAI GPT')

    Returns:
          Nodes and Relations created in Neo4j databse for the pdf file
    """
    
    if file:
        return await asyncio.to_thread(
            extract_graph_from_file,
            uri,
            userName,
            password,
            model,
            database,
            file=file,
            source_url=None,
            wiki_query=wiki_query,
            max_sources=max_sources,
        )
    elif source_url:
        return await asyncio.to_thread(
            extract_graph_from_file,
            uri,
            userName,
            password,
            model,
            database,
            source_url=source_url,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            wiki_query=wiki_query,
            max_sources=max_sources,
        )
    else:
        return {"job_status": "Failure", "error": "No file found"}
    

@app.get("/sources_list")
async def get_source_list(uri:str,
                          userName:str,
                          password:str,
                          database:str=None):
    """
    Calls 'get_source_list_from_graph' which returns list of sources which alreday exist in databse
    """
    decoded_password = decode_password(password)
    if " " in uri:
       uri= uri.replace(" ","+")
    result = await asyncio.to_thread(get_source_list_from_graph,uri,userName,decoded_password,database)
    return result
    
@app.post("/update_similarity_graph")
async def update_similarity_graph(uri=Form(None),
    userName=Form(None),
    password=Form(None),
    database=Form(None)):
    """
    Calls 'update_graph' which post the query to update the similiar nodes in the graph
    """
   
    result = await asyncio.to_thread(update_graph,uri,userName,password,database)
    return result

def decode_password(pwd):
    sample_string_bytes = base64.b64decode(pwd)
    decoded_password = sample_string_bytes.decode("utf-8")
    return decoded_password
    
if __name__ == "__main__":
    uvicorn.run(app)