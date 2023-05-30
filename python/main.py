# Copyright (C) 2023 Adam K Dean <adamkdean@googlemail.com>
# Use of this source code is governed by the GPL-3.0
# license that can be found in the LICENSE file.

import os
import pandas as pd
import matplotlib.pyplot as plt
from dotenv import load_dotenv
from flexdb import FlexDB
from matplotlib.dates import DateFormatter

flexdb = None
store = None

def init():
    load_dotenv()
    flexdb = FlexDB({'apiKey': os.environ['FLEXDB_API_KEY']})
    store = flexdb.ensure_store_exists(os.getenv('FLEXDB_STORE', 'gpt-monitor'))
    return store

def fetch_data(store):
    """
    Fetches all metrics from the database (every single document)
    """
    print('Fetching data from database')
    gpt35t = store.collection('gpt35t')
    gpt35t_total = gpt35t.get_many({'page': 1, 'limit': 1})['metadata']['total']
    gpt35t_metrics = gpt35t.get_many({'limit': gpt35t_total})['documents']
    print('Fetched gpt-3.5-turbo metrics ({} documents)'.format(gpt35t_total)
    gpt4 = store.collection('gpt4')
    gpt4_total = gpt4.get_many({'page': 1, 'limit': 1})['metadata']['total']
    gpt4_metrics = gpt4.get_many({'limit': gpt4_total})['documents']
    print('Fetched gpt-4 metrics ({} documents)'.format(gpt4_total)
    return [{
        'gpt35t': gpt35t_metrics,
        'gpt4': gpt4_metrics
    }]

def create_images(data):
    """
    Generates graph images from the data
    """
    try:
        print('Generating images')
        images_path = os.getenv('OUTPUT_PATH', './')
        if not os.path.exists(images_path):
            os.makedirs(images_path)

        metrics_to_plot = {
            'msPerToken': {
                'title': 'Milliseconds per Token (last 24 hours)',
                'ylabel': 'Milliseconds'
            },
            'tokensPerMinute': {
                'title': 'Tokens per Minute (last 24 hours)',
                'ylabel': 'Tokens/Min'
            },
            'timeToFirstByte': {
                'title': 'Time to First Byte (last 24 hours)',
                'ylabel': 'Milliseconds'
            },
            'timeToLastByte': {
                'title': 'Time to Last Byte (last 24 hours)',
                'ylabel': 'Milliseconds'
            },
        }

        for metric, plot_settings in metrics_to_plot.items():
            print(f'Generating image for {metric}')
            plt.figure(figsize=(12, 6))

            for key in data[0]:
                df = pd.json_normalize(data[0][key])
                df['createdAt'] = pd.to_datetime(df['createdAt']).dt.tz_localize(None)
                plt.plot(df['createdAt'], df[metric], label=key)

            plt.title(plot_settings['title'])
            plt.xlabel('Time')
            plt.ylabel(plot_settings['ylabel'])
            plt.legend()
            plt.grid(True)
            plt.tight_layout()

            # Format x-axis to show date and time
            date_format = DateFormatter('%D %H:%M')
            plt.gca().xaxis.set_major_formatter(date_format)

            # Rotate date labels automatically
            plt.gcf().autofmt_xdate()

            filename = f'{metric}_over_time.png'
            plt.savefig(os.path.join(images_path, filename))
            plt.close()
    except Exception as e:
        print(f'An error occurred while creating the images: {e}')

def main():
    try:
        store = init()
        data = fetch_data(store)
        create_images(data)
    except Exception as e:
        print(f'An error occurred: {e}')

if __name__ == '__main__':
    main()
