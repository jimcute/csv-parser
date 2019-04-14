import pandas as pd
chunksize = 10 ** 8
def process(chunk):
    print(chunk)
    
for chunk in pd.read_csv('sample.csv', chunksize=chunksize):
    process(chunk)