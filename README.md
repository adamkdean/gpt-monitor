# GPT Monitor

GPT Monitor is a project that monitors OpenAI's GPT models by measuring certain metrics of their responses to a set of prompts. The project aims to both track the changes and progress of the models over time by analyzing various metrics of their responses, and to provide a public benchmark of performance over time.

![image](https://github.com/adamkdean/gpt-monitor/assets/1639527/f4f05138-1157-4b3d-9186-8947bef9b770)

Other metrics include ms per token, time to first byte, and time to last byte.

[View live metrics](https://gpt-monitor.adamkdean.co.uk)

Note: this is a small fire-and-forget pet project. It is not intended to be used for anything serious.

### Improvements

The following improvements would make this better, but cost more:

1. Run multiple requests each time and use the mean
2. Run requests more frequently (currently at 15 minutes)

Also

3. Providing a granular last 24 hours and a less granular mean of daily values
4. More metrics, such as tokens per minute per sequence length (another project perhaps)

## Contributing

Feel free to submit issues or pull requests if you'd like to contribute to the project or have any suggestions for improvements.

## License

```js
// Copyright (C) 2023 Adam K Dean <adamkdean@googlemail.com>
// Use of this source code is governed by the GPL-3.0
// license that can be found in the LICENSE file.
```
