import React from 'react';
import './bookclub.css';

export function BookClub() {
  return (
    <main>
      <h2>Current Book: <i>East of Eden</i></h2>
      <table>
        <thead>
          <tr>
            <th>Reader</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Kaija Sorensen</td>
            <td><label for="reading-progress">Reading Progress:</label> <progress id="reading-progress" value="65" max="100"></progress></td>
          </tr>
          <tr>
            <td>Abby Gugler</td>
            <td><label for="reading-progress-2">Reading Progress:</label> <progress id="reading-progress-2" value="30" max="100"></progress></td>
          </tr>
          <tr>
            <td>Cora Atkinson</td>
            <td><label for="reading-progress-3">Reading Progress:</label> <progress id="reading-progress-3" value="45" max="100"></progress></td>
          </tr>
        </tbody>
      </table>

      <h3>Add a Book Club Read</h3>
                <p>Enter the title of a book to read as a group</p>
                <form method="get" action="bookshelf.html">
                    <div>
                    <input type="text" placeholder="Search for a book title..." />
                    </div>
                    <div className="api-book-result">
                    </div>
                    <select id="options-clubs" name="options-clubs" placeholder="Select a book club group to read this with">
                        <option value="Girlfriends">Girlfriends</option>
                        <option value="Family">Family</option>
                        <option value="Work Besties">Work Besties</option>
                    </select><br></br>
                    <button className="btn btn-success" type="submit">Add to Book Club</button>
                </form>
    </main>
  );
}